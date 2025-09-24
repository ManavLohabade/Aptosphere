module aptosphere::world {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;

    // ===== STRUCTS =====

    /// Represents an item in the world
    struct Item has store {
        id: u64,
        name: String,
        owner: address,
    }

    /// Player resource that stores all player data
    struct Player has key {
        id: u64,
        username: String,
        x: u64,
        y: u64,
        balance: u64,
        inventory: vector<Item>,
    }

    /// World state resource
    struct WorldState has key {
        next_player_id: u64,
        next_item_id: u64,
        players: vector<address>,
    }

    // ===== EVENTS =====

    /// Emitted when a player joins the world
    struct PlayerJoinedEvent has store, drop {
        player_address: address,
        username: String,
        x: u64,
        y: u64,
        balance: u64,
    }

    /// Emitted when a player moves
    struct PlayerMovedEvent has store, drop {
        player_address: address,
        old_x: u64,
        old_y: u64,
        new_x: u64,
        new_y: u64,
    }

    /// Emitted when a player leaves the world
    struct PlayerLeftEvent has store, drop {
        player_address: address,
        username: String,
    }

    /// Emitted when a tip is sent
    struct TipSentEvent has store, drop {
        sender: address,
        recipient: address,
        amount: u64,
    }

    // ===== INITIALIZATION =====

    /// Initialize the world contract
    public fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        
        // Initialize world state
        move_to(account, WorldState {
            next_player_id: 1,
            next_item_id: 1,
            players: vector::empty<address>(),
        });

        // Initialize event handles
        move_to(account, event::new_event_handle<PlayerJoinedEvent>(account));
        move_to(account, event::new_event_handle<PlayerMovedEvent>(account));
        move_to(account, event::new_event_handle<PlayerLeftEvent>(account));
        move_to(account, event::new_event_handle<TipSentEvent>(account));
    }

    // ===== PLAYER FUNCTIONS =====

    /// Join the world as a new player
    public fun join_world(account: &signer, username: vector<u8>) {
        let account_addr = signer::address_of(account);
        let world_state = borrow_global_mut<WorldState>(@aptosphere);
        
        // Check if player already exists
        assert!(!exists<Player>(account_addr), 1); // Player already exists
        
        let username_string = string::utf8(username);
        let player_id = world_state.next_player_id;
        let balance = coin::balance<AptosCoin>(account_addr);
        
        // Create player resource
        move_to(account, Player {
            id: player_id,
            username: username_string,
            x: 0,
            y: 0,
            balance,
            inventory: vector::empty<Item>(),
        });
        
        // Add player to world state
        vector::push_back(&mut world_state.players, account_addr);
        world_state.next_player_id = world_state.next_player_id + 1;
        
        // Emit event
        let event_handle = borrow_global<EventHandle<PlayerJoinedEvent>>(@aptosphere);
        event::emit_event(event_handle, PlayerJoinedEvent {
            player_address: account_addr,
            username: username_string,
            x: 0,
            y: 0,
            balance,
        });
    }

    /// Leave the world
    public fun leave_world(account: &signer) {
        let account_addr = signer::address_of(account);
        let player = borrow_global<Player>(account_addr);
        let world_state = borrow_global_mut<WorldState>(@aptosphere);
        
        // Remove player from world state
        let (found, index) = vector::index_of(&world_state.players, &account_addr);
        if (found) {
            vector::remove(&mut world_state.players, index);
        };
        
        // Emit event
        let event_handle = borrow_global<EventHandle<PlayerLeftEvent>>(@aptosphere);
        event::emit_event(event_handle, PlayerLeftEvent {
            player_address: account_addr,
            username: player.username,
        });
        
        // Destroy player resource
        let Player { id: _, username: _, x: _, y: _, balance: _, inventory: _ } = move_from<Player>(account_addr);
    }

    /// Move player to new coordinates
    public fun move_player(account: &signer, new_x: u64, new_y: u64) {
        let account_addr = signer::address_of(account);
        let player = borrow_global_mut<Player>(account_addr);
        
        let old_x = player.x;
        let old_y = player.y;
        
        // Update position
        player.x = new_x;
        player.y = new_y;
        
        // Emit event
        let event_handle = borrow_global<EventHandle<PlayerMovedEvent>>(@aptosphere);
        event::emit_event(event_handle, PlayerMovedEvent {
            player_address: account_addr,
            old_x,
            old_y,
            new_x,
            new_y,
        });
    }

    /// Send a tip to another player
    public fun send_tip(account: &signer, recipient: address, amount: u64) {
        let sender_addr = signer::address_of(account);
        let sender_player = borrow_global_mut<Player>(sender_addr);
        let recipient_player = borrow_global_mut<Player>(recipient);
        
        // Check if recipient exists
        assert!(exists<Player>(recipient), 2); // Recipient not found
        
        // Check if sender has enough balance
        assert!(sender_player.balance >= amount, 3); // Insufficient balance
        
        // Update balances
        sender_player.balance = sender_player.balance - amount;
        recipient_player.balance = recipient_player.balance + amount;
        
        // Transfer coins
        let coins = coin::withdraw<AptosCoin>(account, amount);
        coin::deposit(recipient, coins);
        
        // Emit event
        let event_handle = borrow_global<EventHandle<TipSentEvent>>(@aptosphere);
        event::emit_event(event_handle, TipSentEvent {
            sender: sender_addr,
            recipient,
            amount,
        });
    }

    // ===== VIEW FUNCTIONS =====

    /// Get player information
    public fun get_player_info(player_addr: address): (u64, String, u64, u64, u64, u64) {
        let player = borrow_global<Player>(player_addr);
        (player.id, player.username, player.x, player.y, player.balance, vector::length(&player.inventory))
    }

    /// Get world state
    public fun get_world_state(): (u64, u64, u64) {
        let world_state = borrow_global<WorldState>(@aptosphere);
        (world_state.next_player_id, world_state.next_item_id, vector::length(&world_state.players))
    }

    /// Check if player exists
    public fun player_exists(player_addr: address): bool {
        exists<Player>(player_addr)
    }

    /// Get all player addresses
    public fun get_all_players(): vector<address> {
        let world_state = borrow_global<WorldState>(@aptosphere);
        world_state.players
    }

    // ===== TESTS =====

    #[test(admin = @0x1)]
    public fun test_join_world(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Initialize world
        initialize(admin);
        
        // Create test account
        let test_account = account::create_account_for_test(0x123);
        let test_addr = signer::address_of(&test_account);
        
        // Join world
        join_world(&test_account, b"TestPlayer");
        
        // Verify player exists
        assert!(player_exists(test_addr), 0);
        
        let (id, username, x, y, balance, inventory_len) = get_player_info(test_addr);
        assert!(id == 1, 0);
        assert!(username == string::utf8(b"TestPlayer"), 0);
        assert!(x == 0, 0);
        assert!(y == 0, 0);
        assert!(inventory_len == 0, 0);
    }

    #[test(admin = @0x1)]
    public fun test_move_player(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Initialize world
        initialize(admin);
        
        // Create test account
        let test_account = account::create_account_for_test(0x123);
        
        // Join world
        join_world(&test_account, b"TestPlayer");
        
        // Move player
        move_player(&test_account, 5, 10);
        
        // Verify position
        let (_, _, x, y, _, _) = get_player_info(signer::address_of(&test_account));
        assert!(x == 5, 0);
        assert!(y == 10, 0);
    }
}
