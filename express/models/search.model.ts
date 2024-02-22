import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket, PoolConnection } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class Search {

  static list(userType_id:number, search: any, separateSearch:any, currentPage: any, postsPerPage: any, categoryId: any | null, result: (arg0: any, arg1: any) => void) {
    const currentPageNumber = parseInt(currentPage, 10) || 1;
    const postsPerPageNumber = parseInt(postsPerPage, 10) || 5;

    if (isNaN(currentPageNumber) || isNaN(postsPerPageNumber)) {
      const error = new Error("현재페이지의 숫자나 표시 개수가 형식이 숫자가 아닙니다.");
      console.log(error);
      result(error, null);
      connection.releaseConnection;
      return;
    }

    const offset = (currentPageNumber - 1) * postsPerPageNumber;
    const limit = postsPerPageNumber;

    const buildQuery = (isCount: boolean, isPrintData: boolean) => {
      const baseQuery = `
      SELECT 
        p.*,
        po.*, 
        p.product_price * (1-p.product_discount/100) * (SELECT (1-userType_discount/100) FROM users_type WHERE userType_id = ?) AS product_amount,
        ((p.product_price - (p.product_price * (1-p.product_discount/100) * (SELECT (1-userType_discount/100) FROM users_type WHERE userType_id = ?)))/p.product_price)*100 AS discount_amount
      FROM product AS p 
      JOIN product_option AS po 
        ON p.product_id = po.product_id`;
      const countBaseQuery = "SELECT COUNT(*) as totalRows FROM product AS p JOIN product_option AS po ON p.product_id = po.product_id";
      const dataBaseQuery = "SELECT p.category_id, p.parentsCategory_id, p.product_brand, p.product_madeIn FROM product AS p JOIN product_option AS po ON p.product_id = po.product_id";
      const conditionColumns = ["p.product_id", "p.product_title", "p.product_brand", "p.product_spec", "p.product_model"];
      const conditionSingle = `WHERE (${conditionColumns.map(column => `${column} LIKE ?`).join(" OR ")})`;
      const conditionObject = `AND (${conditionColumns.map(column => `${column} LIKE ?`).join(" AND ")})`;
      const conditionFindParentsCategory = `AND p.parentsCategory_id = ?`
      const conditionFindCategory = `AND p.category_id = ?`
      const conditionFindBrand = `AND p.product_brand = ?`
      const conditionFindMadeIn = `AND p.product_madeIn = ?`
      const orderBy = "ORDER BY p.product_id DESC";
      const limitClause = "LIMIT ?, ?";
      return `${isCount ? isPrintData ? dataBaseQuery : countBaseQuery : baseQuery} ${conditionSingle} ${conditionObject} ${categoryId !== null ? categoryId.category_id ? conditionFindCategory : categoryId.parentsCategory_id ? conditionFindParentsCategory : categoryId.product_brand ? conditionFindBrand : conditionFindMadeIn : ""} ${isCount ? "" : orderBy} ${isCount ? "" : limitClause}`;
    };

    const query = buildQuery(false, false);
    const countQuery = buildQuery(true, false);
    const dataQuery = buildQuery(true, true);

    const searchTerm = search[0];
    const separateSearchTerm = separateSearch[0];


    connection.query(countQuery, categoryId !== null ? [userType_id, userType_id, `%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`,`%${separateSearchTerm.product_id}%`, `%${separateSearchTerm.product_title}%`, `%${separateSearchTerm.product_brand}%`, `%${separateSearchTerm.product_spec}%`, `%${separateSearchTerm.product_model}%`, categoryId.category_id ? categoryId.category_id : categoryId.parentsCategory_id ? categoryId.parentsCategory_id : categoryId.product_brand ? categoryId.product_brand : categoryId.product_madeIn] : [userType_id, userType_id, `%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`, `%${separateSearchTerm.product_id}%`, `%${separateSearchTerm.product_title}%`, `%${separateSearchTerm.product_brand}%`, `%${separateSearchTerm.product_spec}%`, `%${separateSearchTerm.product_model}%`], (countErr, countResult: any) => {
    if (countErr) {
        console.log(countErr);
        result(countErr, null);
        connection.releaseConnection;
        return;
      }
      connection.query(dataQuery, categoryId !== null ? [userType_id, userType_id, `%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`,`%${separateSearchTerm.product_id}%`, `%${separateSearchTerm.product_title}%`, `%${separateSearchTerm.product_brand}%`, `%${separateSearchTerm.product_spec}%`, `%${separateSearchTerm.product_model}%`, categoryId.category_id ? categoryId.category_id : categoryId.parentsCategory_id ? categoryId.parentsCategory_id : categoryId.product_brand ? categoryId.product_brand : categoryId.product_madeIn] : [userType_id, userType_id, `%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`, `%${separateSearchTerm.product_id}%`, `%${separateSearchTerm.product_title}%`, `%${separateSearchTerm.product_brand}%`, `%${separateSearchTerm.product_spec}%`, `%${separateSearchTerm.product_model}%`], (dataErr, dataResult: any) => {
        if (dataErr) {
          console.log(dataErr);
          result(dataErr, null);
          connection.releaseConnection;
          return;
        }
        const totalRows = countResult[0].totalRows;

        const datas = dataResult;

        connection.query(query, categoryId !== null ? [userType_id, userType_id, `%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`,`%${separateSearchTerm.product_id}%`, `%${separateSearchTerm.product_title}%`, `%${separateSearchTerm.product_brand}%`, `%${separateSearchTerm.product_spec}%`, `%${separateSearchTerm.product_model}%`, categoryId.category_id ? categoryId.category_id : categoryId.parentsCategory_id ? categoryId.parentsCategory_id : categoryId.product_brand ? categoryId.product_brand : categoryId.product_madeIn, offset, limit] : [userType_id, userType_id, `%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`, `%${separateSearchTerm.product_id}%`, `%${separateSearchTerm.product_title}%`, `%${separateSearchTerm.product_brand}%`, `%${separateSearchTerm.product_spec}%`, `%${separateSearchTerm.product_model}%`, offset, limit], (err: QueryError | null, res: RowDataPacket[]) => {
          if (err) {
            console.log("에러 발생: ", err);
            result(err, null);
            connection.releaseConnection;
            return;
          }
          else {
            const totalPages = Math.ceil(totalRows / postsPerPage);
            console.log("Total Pages:", totalPages); // Add this line to check the value
            const responseData = {
              data: res,
              currentPage: currentPage,
              totalPages: totalPages,
              postsPerPage: postsPerPage,
              totalRows: totalRows,
              datas: datas
            }
            console.log("상품이 갱신되었습니다: ", responseData);
            result(null, responseData);
            connection.releaseConnection;
            return;
          }
        });
      })
    })
  }
}

export = Search;