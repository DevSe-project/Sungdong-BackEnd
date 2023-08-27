package com.example.sungdongserver.controller;

import com.example.sungdongserver.dto.ItemDTO;
import com.example.sungdongserver.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class ItemController {

    @Autowired
    ItemService itemService;

    //상품 조회(전체)
    @RequestMapping(value="/item", method = RequestMethod.GET)
    public ResponseEntity<List<ItemDTO>> getAlbumAll() {
        List<ItemDTO> itemDtos = itemService.getItemAll();
        return new ResponseEntity<>(itemDtos, HttpStatus.OK);
    }

    //상품 조회
    @RequestMapping(value = "/item/{itemId}", method = RequestMethod.GET)
    public ResponseEntity<ItemDTO> getItem(@PathVariable("itemId") final long itemId) {
        ItemDTO item = itemService.getItem(itemId);
        return new ResponseEntity<>(item, HttpStatus.OK);
    }

    //상품 등록
//    @RequestMapping(value = "/admin/item/new", method = RequestMethod.POST)
//    public ResponseEntity<ItemDTO> newItem(@RequestBody final ItemDTO itemDTO) {
//
//    }

    //상품 삭제
    @RequestMapping(value = "/admin/item/delete/{itemId}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> deleteItem(@PathVariable("itemId") final long itemId){
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
