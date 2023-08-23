package com.example.sungdongserver.service;

import com.example.sungdongserver.domain.Item;
import com.example.sungdongserver.dto.ItemDTO;
import com.example.sungdongserver.mapper.ItemMapper;
import com.example.sungdongserver.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.persistence.EntityNotFoundException;
import java.util.Optional;

@Service
public class ItemService {
    @Autowired
    private ItemRepository itemRepository;

    public ItemDTO getItem(Long itemId){
        Optional<Item> res = itemRepository.findById(itemId);
        if (res.isPresent()){
            ItemDTO itemDTO = ItemMapper.convertToDto(res.get());
            return itemDTO;
        } else {
            throw new EntityNotFoundException(String.format("상품 아이디 %d로 조회되지 않았습니다", itemId));
        }
    }
}
