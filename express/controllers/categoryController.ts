import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import { Request, Response } from "express"
import Category from "../models/category.model";

const categoryController = {
  create: async (req: Request, res: Response) => {
    const categoryIds: { [key: string]: number } = {};
  
    function getNextCategoryId(parentCategory: string | null, lastCategory: any): string {
      const normalizedParentCategory = parentCategory || '';
      if (!categoryIds[normalizedParentCategory]) {
        console.log(lastCategory)
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
    const lastCategory = await Category.lastest(parentsCategory);
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
}

export default categoryController