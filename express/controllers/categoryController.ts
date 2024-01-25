import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import { Request, Response } from "express"
import Category from "../models/category.model";

const categoryController = {
  create: async (req: Request, res: Response) => {
    const categoryIds: { [key: string]: number } = {};
  
    function getNextCategoryId(parentCategory: string | null, lastCategory: any): string {
      const normalizedParentCategory = parentCategory || '';
      if (!categoryIds[normalizedParentCategory]) {
        const lastCharacter = lastCategory.charAt(lastCategory.length - 1);
        let num : number;
        if(lastCategory.length === 1) {
          num = lastCharacter.charCodeAt(0) - 62
        } else if(lastCategory.length === 2) {
          num = lastCharacter.charCodeAt(0) - 95; // Convert letter to numeric value (A=1, B=2, ...)
        } else {
          num = parseInt(lastCharacter) + 1
        }
        categoryIds[normalizedParentCategory] = num;
      } else {
        categoryIds[normalizedParentCategory]++;
      }
  
      const num = categoryIds[normalizedParentCategory];
  
      if (normalizedParentCategory.length === 1 && num <= 26) {
        return `${normalizedParentCategory}${String.fromCharCode(96 + num)}`;
      } else if (normalizedParentCategory.length === 2 && num <= 100) {
        return `${normalizedParentCategory}${num}`;
      } else if(normalizedParentCategory === '' && num <= 26) {
        return String.fromCharCode(64 + num);
      }
      return "카테고리 최대 생성 개수를 초과하였습니다.";
    }
  
    function generateCategoryId(parentCategory: string | null): string {
      const normalizedParentCategory = parentCategory || '';
      if (!categoryIds[normalizedParentCategory]) {
        categoryIds[normalizedParentCategory] = 1;
      } else {
        categoryIds[normalizedParentCategory]++;
      }
  
      const num = categoryIds[normalizedParentCategory];
  
      if (normalizedParentCategory.length == 1) {
        return `${normalizedParentCategory}${String.fromCharCode(96 + num)}`;
      } else if (normalizedParentCategory.length == 2) {
        return `${normalizedParentCategory}${num}`;
      }
  
      return String.fromCharCode(64 + num);
    }
  
    const parentsCategory = req.body[0].parentsCategory_id;
    const lastCategory = await Category.getlastestCategoryId(parentsCategory);
    try {
        const data = await Promise.all(req.body.map(async (item: { parentsCategory_id: string | null; name: string; category_id: string }) => {
          if (lastCategory !== null) {
            const newCategoryId = getNextCategoryId(parentsCategory, lastCategory);
            return {
              category_id: newCategoryId,
              parentsCategory_id: item.parentsCategory_id,
              name: item.name,
            }
          } else {
            const newCategoryId = generateCategoryId(parentsCategory);
            return {
              category_id: newCategoryId,
              parentsCategory_id: item.parentsCategory_id,
              name: item.name,
            };
          }}))
        await Category.create(data);
        res.status(200).json({ message: '성공적으로 생성이 완료되었습니다.', success: true });  
    } catch (err) {
      res.status(500).send({ message: "카테고리를 갱신하는 중 서버 오류가 발생했습니다." });
    }
  },  
  list : async (req : Request, res : Response) => {
    // 데이터베이스에서 불러오기
    Category.list((err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if(err)
          return res.status(500).send({ message: err.message || "카테고리를 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 카테고리 갱신이 완료 되었습니다.', success: true, data });
        }
    })
  },
  edit : async (req : Request, res : Response) => {
    try {
      // 클라이언트가 보낸 JSON 데이터를 받음
      const data = await Promise.all(req.body.map((item: { category_id: string, parentsCategory_id: string | null, name: string }) => ({
        category_id: item.category_id,
        parentsCategory_id: item.parentsCategory_id,
        name: item.name
      })));
  
      // 데이터베이스에서 해당 parentsCategory_id를 가지고 있는 아이템들을 불러옴
      const existingData = await Category.getByParentCategoryId(data[0].parentsCategory_id);
      
      if(existingData !== null && existingData !== undefined){
        // 기존 데이터 중 클라이언트가 보낸 데이터에 없는 것들은 삭제할 데이터로 간주
        const itemsToDelete = existingData.filter((existingItem: { category_id: string; }) => 
        !data.some((item: { category_id: string; }) => item.category_id === existingItem.category_id)
      );
        //데이터베이스 삭제 로직
        Category.deleteByIds(itemsToDelete, (deleteErr: any, deleteResult: any) => {
          if (deleteErr) {
            return res.status(500).send({ message: deleteErr.message || "카테고리를 삭제하는 중 서버 오류가 발생했습니다." });
          } else {
            // 기존 데이터와 새로운 데이터를 비교하여 변경된 부분만 업데이트
            const updates = existingData.map((existingItem: { category_id: string; }) => {
              const updatedItem = data.find((item: { category_id: string; }) => item.category_id === existingItem.category_id);
              return { ...existingItem, ...updatedItem };
            });
            // 업데이트된 데이터로 데이터베이스 업데이트
            Category.updateByParentCategoryId(data[0].parentsCategory_id, updates, (updateErr: any, updateResult: any) => {
              if (updateErr) {
                return res.status(500).send({ message: updateErr.message || "카테고리를 갱신하는 중 서버 오류가 발생했습니다." });
              } else {
                return res.status(200).json({ message: '성공적으로 카테고리 갱신이 완료 되었습니다.', success: true, updateResult });
              }
            });
        }})
      }
    } catch (error) {
      return res.status(500).send({ message: error || "서버 오류가 발생했습니다." });
    }
  },
}

export default categoryController