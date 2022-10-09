from pyteal import *


class Item:
    class Variables:  # 3 global ints, 5 global bytes
        name = Bytes("NAME")  # bytes
        description = Bytes("DESCRIPTION")  # bytes
        image = Bytes("IMAGE")  # bytes
        location = Bytes("LOCATION")  # bytes
        current_price = Bytes("PRICE")  # uint64
        previous_price = Bytes("PREVPRICE")  # uint64
        current_owner = Bytes("OWNER")  # bytes
        is_item_listed = Bytes("LISTED")  # uin64 bool ( 0 - false, 1 - true)

    class AppMethods:
        buy = Bytes("buy")
        relist = Bytes("relist")
        unlist = Bytes("unlist")

    # allow users to create a new item application
    def create_item(self):
        return Seq(
            [   # checks if application_args have the required values to initialize the application
                # checks if the input data contain only valid/non-empty values
                Assert(
                    And(
                        Txn.application_args.length() == Int(5),
                        Txn.note() == Bytes("justArt-market:uv01"),
                        Btoi(Txn.application_args[4]) > Int(0),
                        Len(Txn.application_args[0]) > Int(0),
                        Len(Txn.application_args[1]) > Int(0),
                        Len(Txn.application_args[2]) > Int(0),
                        Len(Txn.application_args[3]) > Int(0),
                    )
                ),
                App.globalPut(self.Variables.name, Txn.application_args[0]),
                App.globalPut(self.Variables.description,
                              Txn.application_args[1]),
                App.globalPut(self.Variables.image, Txn.application_args[2]),
                App.globalPut(self.Variables.location,
                              Txn.application_args[3]),
                App.globalPut(self.Variables.current_price,
                              Btoi(Txn.application_args[4])),
                App.globalPut(self.Variables.current_owner, Txn.accounts[0]),
                App.globalPut(self.Variables.is_item_listed, Int(1)),
                Approve()
            ]
        )
    # allow users to buy an item that is on sale
    # checks if the prerequisite conditions to buy am item are met
    def buy(self):
        valid_number_of_transactions = Global.group_size() == Int(2)
        valid_grouping = Txn.group_index() == Int(0)

        item_listed = App.globalGet(self.Variables.is_item_listed) == Int(1)

        price = App.globalGet(self.Variables.current_price)

        new_owner = Txn.accounts[0]
        previous_owner = Txn.accounts[1]
        valid_params = previous_owner == App.globalGet(
            self.Variables.current_owner)
        is_not_owner = new_owner != App.globalGet(self.Variables.current_owner) 
        # check payment parameters
        valid_payment_to_seller = And(
            Gtxn[1].type_enum() == TxnType.Payment,
            Gtxn[1].receiver() == previous_owner,
            Gtxn[1].amount() == price,
            Gtxn[1].sender() == Gtxn[0].sender(),
        )

        can_buy = And(
            is_not_owner,
            item_listed,
            valid_number_of_transactions,
            valid_grouping,
            valid_params,
            valid_payment_to_seller,
        )

        update_state = Seq([
            App.globalPut(self.Variables.current_owner, new_owner),
            App.globalPut(self.Variables.previous_price, price),
            App.globalPut(self.Variables.current_price, Int(0)),
            App.globalPut(self.Variables.is_item_listed, Int(0)),
            Approve()
        ])

        return If(can_buy).Then(update_state).Else(Reject())

    # allow items' owners to relist their items that were not on sale
    def relist(self):
        return Seq(
            [
                # checks if item is not listed
                # checks if sender is the item's current owner
                # checks if the input data in application_args are valid values
                Assert(
                    And(
                        App.globalGet(self.Variables.is_item_listed) == Int(0),
                        App.globalGet(
                            self.Variables.current_owner) == Txn.sender(),
                        Txn.application_args.length() == Int(3),
                        Btoi(Txn.application_args[2]) > Int(0),
                        Len(Txn.application_args[1]) > Int(0),

                    )
                ),

                App.globalPut(self.Variables.is_item_listed, Int(1)),
                App.globalPut(self.Variables.location,
                              Txn.application_args[1]),
                App.globalPut(self.Variables.current_price,
                              Btoi(Txn.application_args[2])),
                Approve()
            ]
        )
    # allow items' owners to unlist their items from the marketplace
    def unlist(self):
        return Seq(
            [
                # checks if item is listed
                # checks if sender is the item's current owner
                Assert(
                    And(
                        App.globalGet(self.Variables.is_item_listed) == Int(1),
                        App.globalGet(
                            self.Variables.current_owner) == Txn.sender(),
                    )
                ),

                App.globalPut(self.Variables.is_item_listed, Int(0)),
                App.globalPut(self.Variables.current_price,
                              Int(0)),
                Approve()
            ]
        )

    def application_deletion(self):
        return Return(Txn.sender() == App.globalGet(self.Variables.current_owner))

    def application_start(self):
        return Cond(
            [Txn.application_id() == Int(0), self.create_item()],
            [Txn.on_completion() == OnComplete.DeleteApplication,
             self.application_deletion()],
            [Txn.application_args[0] == self.AppMethods.buy, self.buy()],
            [Txn.application_args[0] == self.AppMethods.relist, self.relist()],
            [Txn.application_args[0] == self.AppMethods.unlist, self.unlist()],
        )

    def approval_program(self):
        return self.application_start()

    def clear_program(self):
        return Return(Int(1))
