module aptosphere::defi {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::table::{Self, Table};

    // ===== STRUCTS =====

    /// Prediction market event
    struct Market has store {
        id: u64,
        title: String,
        description: String,
        creator: address,
        end_time: u64,
        outcome: u8, // 0: unresolved, 1: outcome_a, 2: outcome_b
        total_pool: u64,
        outcome_a_pool: u64,
        outcome_b_pool: u64,
        resolved: bool,
    }

    /// User's bet on a market
    struct Bet has store {
        id: u64,
        user: address,
        market_id: u64,
        outcome: u8, // 1: outcome_a, 2: outcome_b
        amount: u64,
        potential_payout: u64,
        claimed: bool,
    }

    /// DeFi store for managing markets and bets
    struct DeFiStore has key {
        next_market_id: u64,
        next_bet_id: u64,
        markets: Table<u64, Market>,
        bets: Table<u64, Bet>,
        user_bets: Table<address, vector<u64>>,
        market_bets: Table<u64, vector<u64>>,
    }

    // ===== EVENTS =====

    /// Emitted when a new market is created
    struct MarketCreatedEvent has store, drop {
        market_id: u64,
        creator: address,
        title: String,
        end_time: u64,
    }

    /// Emitted when a bet is placed
    struct BetPlacedEvent has store, drop {
        bet_id: u64,
        user: address,
        market_id: u64,
        outcome: u8,
        amount: u64,
    }

    /// Emitted when a market is resolved
    struct MarketResolvedEvent has store, drop {
        market_id: u64,
        outcome: u8,
        total_payout: u64,
    }

    /// Emitted when a bet is claimed
    struct BetClaimedEvent has store, drop {
        bet_id: u64,
        user: address,
        payout: u64,
    }

    // ===== CONSTANTS =====

    const OUTCOME_UNRESOLVED: u8 = 0;
    const OUTCOME_A: u8 = 1;
    const OUTCOME_B: u8 = 2;

    // ===== INITIALIZATION =====

    /// Initialize the DeFi contract
    public fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        
        // Initialize DeFi store
        move_to(account, DeFiStore {
            next_market_id: 1,
            next_bet_id: 1,
            markets: table::new<u64, Market>(),
            bets: table::new<u64, Bet>(),
            user_bets: table::new<address, vector<u64>>(),
            market_bets: table::new<u64, vector<u64>>(),
        });

        // Initialize event handles
        move_to(account, event::new_event_handle<MarketCreatedEvent>(account));
        move_to(account, event::new_event_handle<BetPlacedEvent>(account));
        move_to(account, event::new_event_handle<MarketResolvedEvent>(account));
        move_to(account, event::new_event_handle<BetClaimedEvent>(account));
    }

    // ===== MARKET FUNCTIONS =====

    /// Create a new prediction market
    public fun create_market(
        account: &signer,
        title: vector<u8>,
        description: vector<u8>,
        end_time: u64
    ) {
        let creator = signer::address_of(account);
        let defi_store = borrow_global_mut<DeFiStore>(@aptosphere);
        
        let market_id = defi_store.next_market_id;
        let current_time = aptos_framework::timestamp::now_seconds();
        
        // Validate end time
        assert!(end_time > current_time, 1); // End time must be in the future
        
        let market = Market {
            id: market_id,
            title: string::utf8(title),
            description: string::utf8(description),
            creator,
            end_time,
            outcome: OUTCOME_UNRESOLVED,
            total_pool: 0,
            outcome_a_pool: 0,
            outcome_b_pool: 0,
            resolved: false,
        };
        
        // Add market to store
        table::add(&mut defi_store.markets, market_id, market);
        table::add(&mut defi_store.market_bets, market_id, vector::empty<u64>());
        
        defi_store.next_market_id = defi_store.next_market_id + 1;
        
        // Emit event
        let event_handle = borrow_global<EventHandle<MarketCreatedEvent>>(@aptosphere);
        event::emit_event(event_handle, MarketCreatedEvent {
            market_id,
            creator,
            title: market.title,
            end_time,
        });
    }

    /// Place a bet on a market
    public fun place_bet(
        account: &signer,
        market_id: u64,
        outcome: u8,
        amount: u64
    ) {
        let user = signer::address_of(account);
        let defi_store = borrow_global_mut<DeFiStore>(@aptosphere);
        
        // Check if market exists
        assert!(table::contains(&defi_store.markets, market_id), 1); // Market not found
        
        let market = table::borrow_mut(&defi_store.markets, market_id);
        let current_time = aptos_framework::timestamp::now_seconds();
        
        // Validate bet
        assert!(!market.resolved, 2); // Market already resolved
        assert!(current_time < market.end_time, 3); // Market has ended
        assert!(outcome == OUTCOME_A || outcome == OUTCOME_B, 4); // Invalid outcome
        assert!(amount > 0, 5); // Amount must be positive
        
        // Check user has enough balance
        let user_balance = coin::balance<AptosCoin>(user);
        assert!(user_balance >= amount, 6); // Insufficient balance
        
        // Calculate potential payout
        let potential_payout = calculate_potential_payout(market, outcome, amount);
        
        // Create bet
        let bet_id = defi_store.next_bet_id;
        let bet = Bet {
            id: bet_id,
            user,
            market_id,
            outcome,
            amount,
            potential_payout,
            claimed: false,
        };
        
        // Add bet to store
        table::add(&mut defi_store.bets, bet_id, bet);
        
        // Add to user bets
        add_to_user_bets(&mut defi_store.user_bets, user, bet_id);
        
        // Add to market bets
        let market_bets = table::borrow_mut(&mut defi_store.market_bets, market_id);
        vector::push_back(market_bets, bet_id);
        
        // Update market pools
        market.total_pool = market.total_pool + amount;
        if (outcome == OUTCOME_A) {
            market.outcome_a_pool = market.outcome_a_pool + amount;
        } else {
            market.outcome_b_pool = market.outcome_b_pool + amount;
        };
        
        defi_store.next_bet_id = defi_store.next_bet_id + 1;
        
        // Transfer coins to contract
        let coins = coin::withdraw<AptosCoin>(account, amount);
        // Note: In a real implementation, coins would be held by the contract
        
        // Emit event
        let event_handle = borrow_global<EventHandle<BetPlacedEvent>>(@aptosphere);
        event::emit_event(event_handle, BetPlacedEvent {
            bet_id,
            user,
            market_id,
            outcome,
            amount,
        });
    }

    /// Resolve a market (only creator can resolve)
    public fun resolve_market(account: &signer, market_id: u64, outcome: u8) {
        let resolver = signer::address_of(account);
        let defi_store = borrow_global_mut<DeFiStore>(@aptosphere);
        
        // Check if market exists
        assert!(table::contains(&defi_store.markets, market_id), 1); // Market not found
        
        let market = table::borrow_mut(&defi_store.markets, market_id);
        
        // Validate resolution
        assert!(market.creator == resolver, 2); // Only creator can resolve
        assert!(!market.resolved, 3); // Market already resolved
        assert!(outcome == OUTCOME_A || outcome == OUTCOME_B, 4); // Invalid outcome
        
        // Set market outcome
        market.outcome = outcome;
        market.resolved = true;
        
        // Emit event
        let event_handle = borrow_global<EventHandle<MarketResolvedEvent>>(@aptosphere);
        event::emit_event(event_handle, MarketResolvedEvent {
            market_id,
            outcome,
            total_payout: market.total_pool,
        });
    }

    /// Claim winnings from a bet
    public fun claim_bet(account: &signer, bet_id: u64) {
        let user = signer::address_of(account);
        let defi_store = borrow_global_mut<DeFiStore>(@aptosphere);
        
        // Check if bet exists
        assert!(table::contains(&defi_store.bets, bet_id), 1); // Bet not found
        
        let bet = table::borrow_mut(&defi_store.bets, bet_id);
        assert!(bet.user == user, 2); // Not your bet
        assert!(!bet.claimed, 3); // Already claimed
        
        // Check if market is resolved
        let market = table::borrow(&defi_store.markets, bet.market_id);
        assert!(market.resolved, 4); // Market not resolved
        
        // Check if bet won
        assert!(bet.outcome == market.outcome, 5); // Bet did not win
        
        // Calculate payout
        let payout = bet.potential_payout;
        bet.claimed = true;
        
        // Transfer winnings (in real implementation)
        // coin::deposit(user, payout);
        
        // Emit event
        let event_handle = borrow_global<EventHandle<BetClaimedEvent>>(@aptosphere);
        event::emit_event(event_handle, BetClaimedEvent {
            bet_id,
            user,
            payout,
        });
    }

    /// Calculate potential payout for a bet
    fun calculate_potential_payout(market: &Market, outcome: u8, amount: u64): u64 {
        if (outcome == OUTCOME_A) {
            if (market.outcome_a_pool == 0) {
                amount // First bet on outcome A
            } else {
                (amount * market.total_pool) / market.outcome_a_pool
            }
        } else {
            if (market.outcome_b_pool == 0) {
                amount // First bet on outcome B
            } else {
                (amount * market.total_pool) / market.outcome_b_pool
            }
        }
    }

    /// Helper function to add bet to user's bet list
    fun add_to_user_bets(
        user_bets: &mut Table<address, vector<u64>>,
        user: address,
        bet_id: u64
    ) {
        if (table::contains(user_bets, user)) {
            let bets = table::borrow_mut(user_bets, user);
            vector::push_back(bets, bet_id);
        } else {
            let mut bets = vector::empty<u64>();
            vector::push_back(&mut bets, bet_id);
            table::add(user_bets, user, bets);
        };
    }

    // ===== VIEW FUNCTIONS =====

    /// Get market information
    public fun get_market_info(market_id: u64): (u64, String, String, address, u64, u8, bool, u64, u64, u64) {
        let defi_store = borrow_global<DeFiStore>(@aptosphere);
        assert!(table::contains(&defi_store.markets, market_id), 1); // Market not found
        
        let market = table::borrow(&defi_store.markets, market_id);
        (market.id, market.title, market.description, market.creator, market.end_time,
         market.outcome, market.resolved, market.total_pool, market.outcome_a_pool, market.outcome_b_pool)
    }

    /// Get bet information
    public fun get_bet_info(bet_id: u64): (u64, address, u64, u8, u64, u64, bool) {
        let defi_store = borrow_global<DeFiStore>(@aptosphere);
        assert!(table::contains(&defi_store.bets, bet_id), 1); // Bet not found
        
        let bet = table::borrow(&defi_store.bets, bet_id);
        (bet.id, bet.user, bet.market_id, bet.outcome, bet.amount, bet.potential_payout, bet.claimed)
    }

    /// Get user's bets
    public fun get_user_bets(user: address): vector<u64> {
        let defi_store = borrow_global<DeFiStore>(@aptosphere);
        if (table::contains(&defi_store.user_bets, user)) {
            *table::borrow(&defi_store.user_bets, user)
        } else {
            vector::empty<u64>()
        }
    }

    /// Get market's bets
    public fun get_market_bets(market_id: u64): vector<u64> {
        let defi_store = borrow_global<DeFiStore>(@aptosphere);
        if (table::contains(&defi_store.market_bets, market_id)) {
            *table::borrow(&defi_store.market_bets, market_id)
        } else {
            vector::empty<u64>()
        }
    }

    /// Check if market exists
    public fun market_exists(market_id: u64): bool {
        let defi_store = borrow_global<DeFiStore>(@aptosphere);
        table::contains(&defi_store.markets, market_id)
    }

    /// Check if bet exists
    public fun bet_exists(bet_id: u64): bool {
        let defi_store = borrow_global<DeFiStore>(@aptosphere);
        table::contains(&defi_store.bets, bet_id)
    }

    // ===== TESTS =====

    #[test(admin = @0x1)]
    public fun test_create_market(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Initialize DeFi
        initialize(admin);
        
        // Create market
        let current_time = aptos_framework::timestamp::now_seconds();
        let end_time = current_time + 3600; // 1 hour from now
        
        create_market(admin, b"Test Market", b"Will it rain tomorrow?", end_time);
        
        // Verify market exists
        assert!(market_exists(1), 0);
        
        let (id, title, description, creator, end, outcome, resolved, total, a_pool, b_pool) = get_market_info(1);
        assert!(id == 1, 0);
        assert!(title == string::utf8(b"Test Market"), 0);
        assert!(creator == admin_addr, 0);
        assert!(end == end_time, 0);
        assert!(outcome == OUTCOME_UNRESOLVED, 0);
        assert!(!resolved, 0);
        assert!(total == 0, 0);
        assert!(a_pool == 0, 0);
        assert!(b_pool == 0, 0);
    }
}
