package com.example.sungdongserver.domain;

import javax.persistence.*;

@Entity
@Table(name = "cart_item", schema = "sungdong", uniqueConstraints = {@UniqueConstraint(columnNames = "cart_item_id")})
public class CartItem {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id")
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_item_id", unique = true, nullable = false)
    private Long cartItemId;

    @Column(name = "count", unique = false, nullable = false)
    private int count;

    public CartItem() {};

    public Long getCartItemId() {
        return cartItemId;
    }

    public void setCartItemId(Long cartItemId) {
        this.cartItemId = cartItemId;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }
}
