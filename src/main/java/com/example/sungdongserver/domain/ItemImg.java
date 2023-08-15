package com.example.sungdongserver.domain;


import javax.persistence.*;

@Entity
@Table(name = "item_img", schema = "sungdong", uniqueConstraints = {@UniqueConstraint(columnNames = "item_img_id")})
public class ItemImg {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id", unique = true, nullable = false)
    private Long itemImgId;

    @Column(name = "img_name", unique = true, nullable = false)
    private String imgName;

    @Column(name = "img_url", unique = true, nullable = false)
    private String imgUrl;

    public ItemImg() {};

    public Long getItemImgId() {
        return itemImgId;
    }

    public void setItemImgId(Long itemImgId) {
        this.itemImgId = itemImgId;
    }

    public String getImgName() {
        return imgName;
    }

    public void setImgName(String imgName) {
        this.imgName = imgName;
    }

    public String getImgUrl() {
        return imgUrl;
    }

    public void setImgUrl(String imgUrl) {
        this.imgUrl = imgUrl;
    }
}
