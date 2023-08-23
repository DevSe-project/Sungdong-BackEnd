package com.example.sungdongserver.mapper;

import com.example.sungdongserver.domain.Item;
import com.example.sungdongserver.dto.ItemDTO;

import java.util.List;
import java.util.stream.Collectors;

public class ItemMapper {
    public static ItemDTO convertToDto(Item item){
        ItemDTO itemDTO = new ItemDTO();
        itemDTO.setItemId(item.getItemId());
        itemDTO.setItemName(item.getItemName());
        itemDTO.setItemContent(item.getItemContent());
        itemDTO.setItemPrice(item.getItemPrice());
        itemDTO.setItemImgUrl(item.getItemImgUrl());
        return itemDTO;
    }

    public static List<ItemDTO> convertToDtoList(List<Item> albums) {
        return albums.stream().map(ItemMapper::convertToDto).collect(Collectors.toList());
    }
}
