package com.example.sungdongserver.domain;

import javax.persistence.*;

@Entity
@Table(name = "cart", schema = "sungdong", uniqueConstraints = {@UniqueConstraint(columnNames = "cart_id")})
public class Cart {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_id", unique = true, nullable = false)
    private Long cartId;

    public Cart() {};

    public Long getCartId() {
        return cartId;
    }

    public void setCartId(Long cartId) {
        this.cartId = cartId;
    }
}
