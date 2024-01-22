import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import { Request, Response } from "express"
import Category from "../models/category.model";

const categoryController = {
  create : async (req : Request, res : Response) => {
    if(!req.body){
        res.status(400).send({
            message: "내용을 채워주세요!"
        });
    };
    
    // 각 카테고리의 ID를 저장하기 위한 맵 (함수 외부로 이동)
    const categoryIds: { [key: string]: number } = {};

    // 카테고리를 생성하는 함수
    function generateCategoryId(parentCategory: string | null): string {
      const normalizedParentCategory = parentCategory || '';

      if (normalizedParentCategory === '') {
        // 대 카테고리
        if (!categoryIds[normalizedParentCategory]) {
          categoryIds[normalizedParentCategory] = 1;
        } else {
          categoryIds[normalizedParentCategory]++;
        }
        return String.fromCharCode(65 + categoryIds[normalizedParentCategory] - 1);
      } 
      else {
        // 중 또는 소 카테고리
        if (!categoryIds[normalizedParentCategory]) {
          categoryIds[normalizedParentCategory] = 1;
        } else {
          categoryIds[normalizedParentCategory]++;
        }

        const num = categoryIds[normalizedParentCategory];

        if (normalizedParentCategory.length === 1) { // 중 카테고리
          if (num <= 26) {
            return `${normalizedParentCategory}${String.fromCharCode(65 + num - 1)}`;
          }
        } else if (normalizedParentCategory.length === 2) {  // 소 카테고리
          if (num <= 100) {
            const parentChars = normalizedParentCategory;
            const subCategoryPrefix = `${parentChars}${Math.floor((num - 1) / 26) + 1}`;
            const subCategorySuffix = String.fromCharCode(65 + ((num - 1) % 26));
            return `${subCategoryPrefix}${subCategorySuffix}`;
          }
        }

        // 기본적으로는 대 카테고리와 동일한 로직
        return String.fromCharCode(65 + num - 1);
      }
    }
    // 서버에서 category_id를 생성하고 할당

    const data = req.body.map((item: {
      name: string; category_id: string; parentsCategory_id: any; 
    }) => 
    ({
      category_id: generateCategoryId(item.parentsCategory_id),
      parentsCategory_id: item.parentsCategory_id,
      name: item.name, // 이 부분은 데이터에 실제로 포함된 속성에 따라 조정해야 합니다.
    }));

    // 데이터베이스에 저장
    Category.create(data, (err: { message: any; }) =>{
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if(err)
          return res.status(500).send({ message: err.message || "카테고리를 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 생성이 완료되었습니다.', success: true });
        }
    })
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