module aptosphere::payments {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::table::{Self, Table};

    // ===== STRUCTS =====

    /// Payment record for tracking transactions
    struct Payment has store {
        id: u64,
        sender: address,
        recipient: address,
        amount: u64,
        timestamp: u64,
        transaction_hash: vector<u8>,
    }

    /// Payment store for managing all payments
    struct PaymentStore has key {
        next_payment_id: u64,
        payments: Table<u64, Payment>,
        user_payments: Table<address, vector<u64>>,
        total_volume: u64,
    }

    // ===== EVENTS =====

    /// Emitted when a tip is sent
    struct TipSentEvent has store, drop {
        sender: address,
        recipient: address,
        amount: u64,
        payment_id: u64,
    }

    /// Emitted when a payment is processed
    struct PaymentProcessedEvent has store, drop {
        payment_id: u64,
        sender: address,
        recipient: address,
        amount: u64,
    }

    // ===== INITIALIZATION =====

    /// Initialize the payments contract
    public fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        
        // Initialize payment store
        move_to(account, PaymentStore {
            next_payment_id: 1,
            payments: table::new<u64, Payment>(),
            user_payments: table::new<address, vector<u64>>(),
            total_volume: 0,
        });

        // Initialize event handles
        move_to(account, event::new_event_handle<TipSentEvent>(account));
        move_to(account, event::new_event_handle<PaymentProcessedEvent>(account));
    }

    // ===== PAYMENT FUNCTIONS =====

    /// Send a tip to another player
    public fun send_tip(account: &signer, recipient: address, amount: u64) {
        let sender_addr = signer::address_of(account);
        let payment_store = borrow_global_mut<PaymentStore>(@aptosphere);
        
        // Check if recipient exists (basic check)
        assert!(recipient != sender_addr, 1); // Cannot send tip to self
        
        // Check if sender has enough balance
        let sender_balance = coin::balance<AptosCoin>(sender_addr);
        assert!(sender_balance >= amount, 2); // Insufficient balance
        
        // Create payment record
        let payment_id = payment_store.next_payment_id;
        let current_time = aptos_framework::timestamp::now_seconds();
        
        let payment = Payment {
            id: payment_id,
            sender: sender_addr,
            recipient,
            amount,
            timestamp: current_time,
            transaction_hash: vector::empty<u8>(), // Will be filled by transaction hash
        };
        
        // Add payment to store
        table::add(&mut payment_store.payments, payment_id, payment);
        
        // Add to user payment lists
        add_to_user_payments(&mut payment_store.user_payments, sender_addr, payment_id);
        add_to_user_payments(&mut payment_store.user_payments, recipient, payment_id);
        
        // Update total volume
        payment_store.total_volume = payment_store.total_volume + amount;
        payment_store.next_payment_id = payment_store.next_payment_id + 1;
        
        // Transfer coins
        let coins = coin::withdraw<AptosCoin>(account, amount);
        coin::deposit(recipient, coins);
        
        // Emit events
        let tip_event_handle = borrow_global<EventHandle<TipSentEvent>>(@aptosphere);
        event::emit_event(tip_event_handle, TipSentEvent {
            sender: sender_addr,
            recipient,
            amount,
            payment_id,
        });
        
        let payment_event_handle = borrow_global<EventHandle<PaymentProcessedEvent>>(@aptosphere);
        event::emit_event(payment_event_handle, PaymentProcessedEvent {
            payment_id,
            sender: sender_addr,
            recipient,
            amount,
        });
    }

    /// Send multiple tips in batch
    public fun send_batch_tips(
        account: &signer,
        recipients: vector<address>,
        amounts: vector<u64>
    ) {
        let sender_addr = signer::address_of(account);
        let len = vector::length(&recipients);
        
        // Check that recipients and amounts vectors have same length
        assert!(len == vector::length(&amounts), 1); // Mismatched array lengths
        
        let i = 0;
        while (i < len) {
            let recipient = *vector::borrow(&recipients, i);
            let amount = *vector::borrow(&amounts, i);
            
            // Send individual tip
            send_tip(account, recipient, amount);
            
            i = i + 1;
        };
    }

    /// Helper function to add payment to user's payment list
    fun add_to_user_payments(
        user_payments: &mut Table<address, vector<u64>>,
        user: address,
        payment_id: u64
    ) {
        if (table::contains(user_payments, user)) {
            let payments = table::borrow_mut(user_payments, user);
            vector::push_back(payments, payment_id);
        } else {
            let mut payments = vector::empty<u64>();
            vector::push_back(&mut payments, payment_id);
            table::add(user_payments, user, payments);
        };
    }

    // ===== VIEW FUNCTIONS =====

    /// Get payment information
    public fun get_payment_info(payment_id: u64): (u64, address, address, u64, u64) {
        let payment_store = borrow_global<PaymentStore>(@aptosphere);
        assert!(table::contains(&payment_store.payments, payment_id), 1); // Payment not found
        
        let payment = table::borrow(&payment_store.payments, payment_id);
        (payment.id, payment.sender, payment.recipient, payment.amount, payment.timestamp)
    }

    /// Get payments for a specific user
    public fun get_user_payments(user: address): vector<u64> {
        let payment_store = borrow_global<PaymentStore>(@aptosphere);
        if (table::contains(&payment_store.user_payments, user)) {
            *table::borrow(&payment_store.user_payments, user)
        } else {
            vector::empty<u64>()
        }
    }

    /// Get total payment volume
    public fun get_total_volume(): u64 {
        let payment_store = borrow_global<PaymentStore>(@aptosphere);
        payment_store.total_volume
    }

    /// Get total number of payments
    public fun get_total_payments(): u64 {
        let payment_store = borrow_global<PaymentStore>(@aptosphere);
        payment_store.next_payment_id - 1
    }

    /// Check if payment exists
    public fun payment_exists(payment_id: u64): bool {
        let payment_store = borrow_global<PaymentStore>(@aptosphere);
        table::contains(&payment_store.payments, payment_id)
    }

    /// Get payment statistics for a user
    public fun get_user_payment_stats(user: address): (u64, u64, u64) {
        let payment_store = borrow_global<PaymentStore>(@aptosphere);
        let user_payments = get_user_payments(user);
        let len = vector::length(&user_payments);
        
        let total_sent = 0;
        let total_received = 0;
        let i = 0;
        
        while (i < len) {
            let payment_id = *vector::borrow(&user_payments, i);
            let payment = table::borrow(&payment_store.payments, payment_id);
            
            if (payment.sender == user) {
                total_sent = total_sent + payment.amount;
            } else {
                total_received = total_received + payment.amount;
            };
            
            i = i + 1;
        };
        
        (total_sent, total_received, len)
    }

    // ===== TESTS =====

    #[test(admin = @0x1)]
    public fun test_send_tip(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Initialize payments
        initialize(admin);
        
        // Create test accounts
        let test_account1 = account::create_account_for_test(0x123);
        let test_account2 = account::create_account_for_test(0x456);
        let test_addr2 = signer::address_of(&test_account2);
        
        // Fund test accounts (in real scenario, this would be done via faucet)
        // For testing, we'll assume accounts have some balance
        
        // Send tip
        send_tip(&test_account1, test_addr2, 100);
        
        // Verify payment was created
        assert!(payment_exists(1), 0);
        
        let (id, sender, recipient, amount, timestamp) = get_payment_info(1);
        assert!(id == 1, 0);
        assert!(sender == signer::address_of(&test_account1), 0);
        assert!(recipient == test_addr2, 0);
        assert!(amount == 100, 0);
        assert!(timestamp > 0, 0);
    }

    #[test(admin = @0x1)]
    public fun test_batch_tips(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Initialize payments
        initialize(admin);
        
        // Create test accounts
        let test_account1 = account::create_account_for_test(0x123);
        let test_account2 = account::create_account_for_test(0x456);
        let test_account3 = account::create_account_for_test(0x789);
        let test_addr2 = signer::address_of(&test_account2);
        let test_addr3 = signer::address_of(&test_account3);
        
        // Create recipients and amounts vectors
        let recipients = vector::empty<address>();
        let amounts = vector::empty<u64>();
        vector::push_back(&mut recipients, test_addr2);
        vector::push_back(&mut recipients, test_addr3);
        vector::push_back(&mut amounts, 50);
        vector::push_back(&mut amounts, 75);
        
        // Send batch tips
        send_batch_tips(&test_account1, recipients, amounts);
        
        // Verify payments were created
        assert!(payment_exists(1), 0);
        assert!(payment_exists(2), 0);
        
        let total_payments = get_total_payments();
        assert!(total_payments == 2, 0);
    }
}
