import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket, PoolConnection } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class Search {

  static list(reqData: any, currentPage: any, postsPerPage: any, categoryId: any | null, result: (arg0: any, arg1: any) => void) {
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
      const baseQuery = "SELECT * FROM product JOIN product_option ON product.product_id = product_option.product_id";
      const countBaseQuery = "SELECT COUNT(*) as totalRows FROM product JOIN product_option ON product.product_id = product_option.product_id";
      const dataBaseQuery = "SELECT product.category_id, product.parentsCategory_id, product.product_brand, product.product_madeIn FROM product JOIN product_option ON product.product_id = product_option.product_id";
      const conditionColumns = ["product.product_id", "product.product_title", "product.product_brand", "product.product_spec", "product.product_model"];
      const conditionSingle = `WHERE ${conditionColumns.map(column => `${column} LIKE ?`).join(" OR ")}`;
      const conditionObject = `WHERE ${conditionColumns.map(column => `${column} LIKE ?`).join(" AND ")}`;
      const conditionFindParentsCategory = `AND product.parentsCategory_id = ?`
      const conditionFindCategory = `AND product.category_id = ?`
      const conditionFindBrand = `AND product.product_brand = ?`
      const conditionFindMadeIn = `AND product.product_madeIn = ?`
      const orderBy = "ORDER BY product.product_id DESC";
      const limitClause = "LIMIT ?, ?";
      return `${isCount ? isPrintData ? dataBaseQuery : countBaseQuery : baseQuery} ${Array.isArray(reqData) ? conditionObject : conditionSingle} ${categoryId !== null ? categoryId.category_id ? conditionFindCategory : categoryId.parentsCategory_id ? conditionFindParentsCategory : categoryId.product_brand ? conditionFindBrand : conditionFindMadeIn : ""} ${isCount ? "" : orderBy} ${isCount ? "" : limitClause}`;
    };

    console.log(reqData);
    console.log(categoryId);
    const query = buildQuery(false, false);
    const countQuery = buildQuery(true, false);
    const dataQuery = buildQuery(true, true);

    const searchTerm = Array.isArray(reqData) ? reqData[0] : reqData;


    connection.query(countQuery, categoryId !== null ? [`%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`, categoryId.category_id ? categoryId.category_id : categoryId.parentsCategory_id ? categoryId.parentsCategory_id : categoryId.product_brand ? categoryId.product_brand : categoryId.product_madeIn] : [`%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`], (countErr, countResult: any) => {
      if (countErr) {
        console.log(countErr);
        result(countErr, null);
        connection.releaseConnection;
        return;
      }
      connection.query(dataQuery, categoryId !== null ? [`%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`, categoryId.category_id ? categoryId.category_id : categoryId.parentsCategory_id ? categoryId.parentsCategory_id : categoryId.product_brand ? categoryId.product_brand : categoryId.product_madeIn] : [`%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`], (dataErr, dataResult: any) => {
        if (dataErr) {
          console.log(dataErr);
          result(dataErr, null);
          connection.releaseConnection;
          return;
        }
        const totalRows = countResult[0].totalRows;

        const datas = dataResult;

        connection.query(query, categoryId !== null ? [`%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`, categoryId.category_id ? categoryId.category_id : categoryId.parentsCategory_id ? categoryId.parentsCategory_id : categoryId.product_brand ? categoryId.product_brand : categoryId.product_madeIn, offset, limit] : [`%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`, offset, limit], (err: QueryError | null, res: RowDataPacket[]) => {
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