package com.example.sungdongserver.domain;

import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "item", schema = "sungdong", uniqueConstraints = {@UniqueConstraint(columnNames = "item_id")})
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id", unique = true, nullable = false)
    private Long itemId;

    @Column(name = "item_name", unique = false, nullable = false)
    private String itemName;

    @Column(name = "item_content", unique = false, nullable = true)
    private String itemContent;

    @Column(name = "item_price", unique = false, nullable = false)
    private int itemPrice;

    @Column(name = "item_img_url", unique = true, nullable = false)
    private String itemImgUrl;

    public Item(){};

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getItemContent() {
        return itemContent;
    }

    public void setItemContent(String itemContent) {
        this.itemContent = itemContent;
    }

    public int getItemPrice() {
        return itemPrice;
    }

    public void setItemPrice(int itemPrice) {
        this.itemPrice = itemPrice;
    }

    public String getItemImgUrl() {
        return itemImgUrl;
    }

    public void setItemImgUrl(String itemImgUrl) {
        this.itemImgUrl = itemImgUrl;
    }
}
