module aptosphere::items {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_framework::table::{Self, Table};

    // ===== STRUCTS =====

    /// Item resource representing a tradeable item
    struct Item has store, key {
        id: u64,
        name: String,
        owner: address,
        created_at: u64,
    }

    /// Item store resource for managing all items
    struct ItemStore has key {
        next_item_id: u64,
        items: Table<u64, Item>,
        owner_items: Table<address, vector<u64>>,
    }

    // ===== EVENTS =====

    /// Emitted when an item is minted
    struct ItemMintedEvent has store, drop {
        item_id: u64,
        item_name: String,
        owner: address,
    }

    /// Emitted when an item is transferred
    struct ItemTransferredEvent has store, drop {
        item_id: u64,
        old_owner: address,
        new_owner: address,
    }

    /// Emitted when items are traded
    struct ItemsTradedEvent has store, drop {
        item1_id: u64,
        item2_id: u64,
        trader1: address,
        trader2: address,
    }

    // ===== INITIALIZATION =====

    /// Initialize the items contract
    public fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        
        // Initialize item store
        move_to(account, ItemStore {
            next_item_id: 1,
            items: table::new<u64, Item>(),
            owner_items: table::new<address, vector<u64>>(),
        });

        // Initialize event handles
        move_to(account, event::new_event_handle<ItemMintedEvent>(account));
        move_to(account, event::new_event_handle<ItemTransferredEvent>(account));
        move_to(account, event::new_event_handle<ItemsTradedEvent>(account));
    }

    // ===== ITEM FUNCTIONS =====

    /// Mint a new item
    public fun mint_item(account: &signer, name: vector<u8>) {
        let account_addr = signer::address_of(account);
        let item_store = borrow_global_mut<ItemStore>(@aptosphere);
        
        let item_id = item_store.next_item_id;
        let item_name = string::utf8(name);
        let current_time = aptos_framework::timestamp::now_seconds();
        
        // Create new item
        let item = Item {
            id: item_id,
            name: item_name,
            owner: account_addr,
            created_at: current_time,
        };
        
        // Add item to store
        table::add(&mut item_store.items, item_id, item);
        
        // Add to owner's items
        if (!table::contains(&item_store.owner_items, account_addr)) {
            table::add(&mut item_store.owner_items, account_addr, vector::empty<u64>());
        };
        let owner_items = table::borrow_mut(&mut item_store.owner_items, account_addr);
        vector::push_back(owner_items, item_id);
        
        // Update next item ID
        item_store.next_item_id = item_store.next_item_id + 1;
        
        // Emit event
        let event_handle = borrow_global<EventHandle<ItemMintedEvent>>(@aptosphere);
        event::emit_event(event_handle, ItemMintedEvent {
            item_id,
            item_name,
            owner: account_addr,
        });
    }

    /// Transfer an item to another address
    public fun transfer_item(account: &signer, recipient: address, item_id: u64) {
        let sender_addr = signer::address_of(account);
        let item_store = borrow_global_mut<ItemStore>(@aptosphere);
        
        // Check if item exists
        assert!(table::contains(&item_store.items, item_id), 1); // Item not found
        
        // Get item and check ownership
        let item = table::borrow(&item_store.items, item_id);
        assert!(item.owner == sender_addr, 2); // Not the owner
        
        // Update item ownership
        let mut item = table::remove(&mut item_store.items, item_id);
        item.owner = recipient;
        table::add(&mut item_store.items, item_id, item);
        
        // Update owner items lists
        let sender_items = table::borrow_mut(&mut item_store.owner_items, sender_addr);
        let (found, index) = vector::index_of(sender_items, &item_id);
        if (found) {
            vector::remove(sender_items, index);
        };
        
        if (!table::contains(&item_store.owner_items, recipient)) {
            table::add(&mut item_store.owner_items, recipient, vector::empty<u64>());
        };
        let recipient_items = table::borrow_mut(&mut item_store.owner_items, recipient);
        vector::push_back(recipient_items, item_id);
        
        // Emit event
        let event_handle = borrow_global<EventHandle<ItemTransferredEvent>>(@aptosphere);
        event::emit_event(event_handle, ItemTransferredEvent {
            item_id,
            old_owner: sender_addr,
            new_owner: recipient,
        });
    }

    /// Trade items between two players (atomic swap)
    public fun trade_items(
        trader1: &signer,
        trader2: &signer,
        item1_id: u64,
        item2_id: u64
    ) {
        let trader1_addr = signer::address_of(trader1);
        let trader2_addr = signer::address_of(trader2);
        let item_store = borrow_global_mut<ItemStore>(@aptosphere);
        
        // Check if both items exist
        assert!(table::contains(&item_store.items, item1_id), 1); // Item 1 not found
        assert!(table::contains(&item_store.items, item2_id), 2); // Item 2 not found
        
        // Get items and verify ownership
        let item1 = table::borrow(&item_store.items, item1_id);
        let item2 = table::borrow(&item_store.items, item2_id);
        assert!(item1.owner == trader1_addr, 3); // Trader 1 doesn't own item 1
        assert!(item2.owner == trader2_addr, 4); // Trader 2 doesn't own item 2
        
        // Perform atomic swap
        let mut item1 = table::remove(&mut item_store.items, item1_id);
        let mut item2 = table::remove(&mut item_store.items, item2_id);
        
        // Swap owners
        item1.owner = trader2_addr;
        item2.owner = trader1_addr;
        
        // Put items back
        table::add(&mut item_store.items, item1_id, item1);
        table::add(&mut item_store.items, item2_id, item2);
        
        // Update owner items lists
        update_owner_items(&mut item_store.owner_items, trader1_addr, item1_id, item2_id);
        update_owner_items(&mut item_store.owner_items, trader2_addr, item2_id, item1_id);
        
        // Emit event
        let event_handle = borrow_global<EventHandle<ItemsTradedEvent>>(@aptosphere);
        event::emit_event(event_handle, ItemsTradedEvent {
            item1_id,
            item2_id,
            trader1: trader1_addr,
            trader2: trader2_addr,
        });
    }

    /// Helper function to update owner items list
    fun update_owner_items(
        owner_items: &mut Table<address, vector<u64>>,
        owner: address,
        remove_id: u64,
        add_id: u64
    ) {
        if (table::contains(owner_items, owner)) {
            let items = table::borrow_mut(owner_items, owner);
            let (found, index) = vector::index_of(items, &remove_id);
            if (found) {
                vector::remove(items, index);
            };
            vector::push_back(items, add_id);
        } else {
            let mut items = vector::empty<u64>();
            vector::push_back(&mut items, add_id);
            table::add(owner_items, owner, items);
        };
    }

    // ===== VIEW FUNCTIONS =====

    /// Get item information
    public fun get_item_info(item_id: u64): (u64, String, address, u64) {
        let item_store = borrow_global<ItemStore>(@aptosphere);
        assert!(table::contains(&item_store.items, item_id), 1); // Item not found
        
        let item = table::borrow(&item_store.items, item_id);
        (item.id, item.name, item.owner, item.created_at)
    }

    /// Get items owned by an address
    public fun get_owner_items(owner: address): vector<u64> {
        let item_store = borrow_global<ItemStore>(@aptosphere);
        if (table::contains(&item_store.owner_items, owner)) {
            *table::borrow(&item_store.owner_items, owner)
        } else {
            vector::empty<u64>()
        }
    }

    /// Check if item exists
    public fun item_exists(item_id: u64): bool {
        let item_store = borrow_global<ItemStore>(@aptosphere);
        table::contains(&item_store.items, item_id)
    }

    /// Get total number of items
    public fun get_total_items(): u64 {
        let item_store = borrow_global<ItemStore>(@aptosphere);
        item_store.next_item_id - 1
    }

    // ===== TESTS =====

    #[test(admin = @0x1)]
    public fun test_mint_item(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Initialize items
        initialize(admin);
        
        // Mint item
        mint_item(admin, b"TestItem");
        
        // Verify item exists
        assert!(item_exists(1), 0);
        
        let (id, name, owner, created_at) = get_item_info(1);
        assert!(id == 1, 0);
        assert!(name == string::utf8(b"TestItem"), 0);
        assert!(owner == admin_addr, 0);
        assert!(created_at > 0, 0);
    }

    #[test(admin = @0x1)]
    public fun test_transfer_item(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Initialize items
        initialize(admin);
        
        // Create test accounts
        let test_account1 = account::create_account_for_test(0x123);
        let test_account2 = account::create_account_for_test(0x456);
        let test_addr2 = signer::address_of(&test_account2);
        
        // Mint item to test_account1
        mint_item(&test_account1, b"TestItem");
        
        // Transfer to test_account2
        transfer_item(&test_account1, test_addr2, 1);
        
        // Verify ownership changed
        let (_, _, owner, _) = get_item_info(1);
        assert!(owner == test_addr2, 0);
    }
}
