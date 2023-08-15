package com.example.sungdongserver.domain;

import javax.persistence.*;

@Entity
@Table(name = "order_item", schema = "sungdong", uniqueConstraints = {@UniqueConstraint(columnNames = "order_item_id")})
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id", unique = true, nullable = false)
    private Long orderItemId;

    @Column(name = "count", unique = false, nullable = false)
    private int count;

    @Column(name = "order_price", unique = false, nullable = false)
    private int orderPrice;

    public OrderItem() {};

    public Long getOrderItemId() {
        return orderItemId;
    }

    public void setOrderItemId(Long orderItemId) {
        this.orderItemId = orderItemId;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public int getOrderPrice() {
        return orderPrice;
    }

    public void setOrderPrice(int orderPrice) {
        this.orderPrice = orderPrice;
    }
}
