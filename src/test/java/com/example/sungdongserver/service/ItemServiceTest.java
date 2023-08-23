package com.example.sungdongserver.service;

import com.example.sungdongserver.domain.Item;
import com.example.sungdongserver.dto.ItemDTO;
import com.example.sungdongserver.repository.ItemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class ItemServiceTest {

    @Autowired
    ItemRepository itemRepository;

    @Autowired
    ItemService itemService;

    @Test
    void getItem() {
        Item item = new Item();
        item.setItemId(1L);
        item.setItemContent("이것은 노가다 장갑입니다.");
        item.setItemName("노가다 장갑");
        item.setItemPrice(10000);
        item.setItemImgUrl("/img/groves.jpg");

        Item savedItem = itemRepository.save(item);

        ItemDTO resItem = itemService.getItem(savedItem.getItemId());
        assertEquals(item.getItemContent(), resItem.getItemContent());
        assertEquals(item.getItemName(), resItem.getItemName());
        assertEquals(item.getItemPrice(), resItem.getItemPrice());
        assertEquals(item.getItemImgUrl(), resItem.getItemImgUrl());
    }
}