package com.example.sungdongserver.controller;

import com.example.sungdongserver.dto.ItemDTO;
import com.example.sungdongserver.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/item")
public class ItemController {

    @Autowired
    ItemService itemService;

    @RequestMapping(value = "/{itemId}", method = RequestMethod.GET)
    public ResponseEntity<ItemDTO> getItem(@PathVariable("itemId") final long itemId){
        ItemDTO item = itemService.getItem(itemId);
        return new ResponseEntity<>(item, HttpStatus.OK);
    }
}
