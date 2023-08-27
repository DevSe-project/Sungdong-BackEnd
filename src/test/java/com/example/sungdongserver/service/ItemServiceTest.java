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

    @Test
    void getItemAll() throws InterruptedException {
        Item item1 = new Item();
        Item item2 = new Item();

        item1.setItemId(1L);
        item1.setItemName("노가다 장갑");
        item1.setItemPrice(10000);
        item1.setItemContent("이것은 노가다 장갑입니다.");
        item1.setItemImgUrl("/img/groves.jpg");

        item2.setItemId(2L);
        item2.setItemName("안전화");
        item2.setItemPrice(30000);
        item2.setItemContent("엄청 안전한 안전화 입니다.");
        item2.setItemImgUrl("/img/shoes.jpg");

        itemRepository.save(item1);
        TimeUnit.SECONDS.sleep(1); //시간차를 벌리기위해 두번째 앨범 생성 1초 딜레이
        itemRepository.save(item2);

        List<Item> resDate = itemRepository.findAll();
        assertEquals("노가다 장갑", resDate.get(0).getItemName());
        assertEquals("안전화", resDate.get(1).getItemName());
        assertEquals(2, resDate.size());
    }

    @Test
    void deleteItem() {
        Item item = new Item();
        item.setItemId(1L);
        item.setItemContent("이것은 노가다 장갑입니다.");
        item.setItemName("노가다 장갑");
        item.setItemPrice(10000);
        item.setItemImgUrl("/img/groves.jpg");

        Item savedItem = itemRepository.save(item);
        itemService.deleteItem(savedItem.getItemId());

        ItemDTO resItem = itemService.getItem(savedItem.getItemId());
        assertEquals(item.getItemContent(), resItem.getItemContent());
        assertEquals(item.getItemName(), resItem.getItemName());
        assertEquals(item.getItemPrice(), resItem.getItemPrice());
        assertEquals(item.getItemImgUrl(), resItem.getItemImgUrl());
    }
}