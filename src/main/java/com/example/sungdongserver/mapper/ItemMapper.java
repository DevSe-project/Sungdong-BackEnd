package com.example.sungdongserver.mapper;

import com.example.sungdongserver.domain.Item;
import com.example.sungdongserver.dto.ItemDTO;

public class ItemMapper {
    public static ItemDTO convertToDo(Item item){
        ItemDTO itemDTO = new ItemDTO();
        itemDTO.setItemId(item.getItemId());
        itemDTO.setItemName(item.getItemName());
        itemDTO.setItemContent(item.getItemContent());
        itemDTO.setItemPrice(item.getItemPrice());
        return itemDTO;
    }
}
