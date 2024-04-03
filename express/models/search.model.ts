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
      const countBaseQuery = `
      SELECT 
        COUNT(*) as totalRows 
      FROM product AS p 
      JOIN product_option AS po 
          ON p.product_id = po.product_id`;
      const dataBaseQuery = `
      SELECT 
        p.category_id, 
        p.parentsCategory_id, 
        p.product_brand, 
        p.product_madeIn 
      FROM product AS p 
      JOIN product_option AS po 
        ON p.product_id = po.product_id`;
      const conditionColumns = ["REPLACE(p.product_id, '-', '')", "p.product_title", "p.product_brand", "REPLACE(p.product_spec, '*', '')", "REPLACE(p.product_model, '-', '')"];
      const conditionSingle = `WHERE (${conditionColumns.map(column => `${column} LIKE ?`).join(" OR ")})`;
      const conditionObject = `AND (${conditionColumns.map(column => `${column} LIKE ?`).join(" AND ")})`;
      const conditionFindParentsCategory = `AND p.parentsCategory_id = ?`
      const conditionFindCategory = `AND p.category_id = ?`
      const conditionFindBrand = `AND p.product_brand = ?`
      const conditionFindMadeIn = `AND p.product_madeIn = ?`
      const orderBy = "ORDER BY p.product_id DESC";
      const limitClause = "LIMIT ?, ?";
      return `${isCount ? isPrintData ? dataBaseQuery : countBaseQuery : baseQuery} ${conditionSingle} ${conditionObject} ${categoryId !== null ? categoryId.category_id ? conditionFindCategory : categoryId.parentsCategory_id ? conditionFindParentsCategory : categoryId.product_brand ? conditionFindBrand : conditionFindMadeIn : ""} ${orderBy} ${isCount || isPrintData ? "" : limitClause}`;
    };

    const query = buildQuery(false, false);
    const countQuery = buildQuery(true, false);
    const dataQuery = buildQuery(true, true);

    const searchTerm = search[0];
    const separateSearchTerm = separateSearch[0];


    connection.query(countQuery, categoryId !== null ? [`%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`,`%${separateSearchTerm.product_id}%`, `%${separateSearchTerm.product_title}%`, `%${separateSearchTerm.product_brand}%`, `%${separateSearchTerm.product_spec}%`, `%${separateSearchTerm.product_model}%`, categoryId.category_id ? categoryId.category_id : categoryId.parentsCategory_id ? categoryId.parentsCategory_id : categoryId.product_brand ? categoryId.product_brand : categoryId.product_madeIn] : [`%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`, `%${separateSearchTerm.product_id}%`, `%${separateSearchTerm.product_title}%`, `%${separateSearchTerm.product_brand}%`, `%${separateSearchTerm.product_spec}%`, `%${separateSearchTerm.product_model}%`], (countErr, countResult: any) => {
    if (countErr) {
        console.log(countErr);
        result(countErr, null);
        connection.releaseConnection;
        return;
      }
      connection.query(dataQuery, categoryId !== null ? [`%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`,`%${separateSearchTerm.product_id}%`, `%${separateSearchTerm.product_title}%`, `%${separateSearchTerm.product_brand}%`, `%${separateSearchTerm.product_spec}%`, `%${separateSearchTerm.product_model}%`, categoryId.category_id ? categoryId.category_id : categoryId.parentsCategory_id ? categoryId.parentsCategory_id : categoryId.product_brand ? categoryId.product_brand : categoryId.product_madeIn] : [`%${searchTerm.product_id}%`, `%${searchTerm.product_title}%`, `%${searchTerm.product_brand}%`, `%${searchTerm.product_spec}%`, `%${searchTerm.product_model}%`, `%${separateSearchTerm.product_id}%`, `%${separateSearchTerm.product_title}%`, `%${separateSearchTerm.product_brand}%`, `%${separateSearchTerm.product_spec}%`, `%${separateSearchTerm.product_model}%`], (dataErr, dataResult: any) => {
        if (dataErr) {
          console.log(dataErr);
          result(dataErr, null);
          connection.releaseConnection;
          return;
        }
        const totalRows = countResult[0].totalRows;

        const datas = dataResult;

        console.log(query);
        console.log(countQuery);
        console.log(dataQuery);
        

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

  static adminList(newFilter: any, currentPage: number, postsPerPage: number, result: (arg0: any, arg1: any) => void) {
    const offset = (currentPage - 1) * postsPerPage;
    const limit = postsPerPage;

    const whereClause = newFilter.searchFilter && newFilter.search ? `WHERE ${newFilter.searchFilter} LIKE ?` : '';

    const baseQuery = `
    SELECT 
      o.*, 
      d.*,        
      product_length,
      order_sum,
      product_title 
    FROM
      \`order\` AS o
    JOIN 
        delivery AS d
    ON 
        o.order_id = d.order_id
    JOIN (
      SELECT 
          o.order_id,
          COUNT(*) AS product_length,
          SUM(op.order_cnt) AS order_sum,
          MAX(p.product_title) AS product_title  
        FROM 
          \`order\` AS o
        JOIN 
          order_product AS op ON o.order_id = op.order_id 
        JOIN 
          product AS p ON op.product_id = p.product_id
        JOIN 
          users_corInfo AS uc ON uc.users_id = o.users_id
        ${whereClause} -- 서브쿼리 내부에서 조건 적용.  
        GROUP BY 
          o.order_id
      ) AS subquery 
      ON o.order_id = subquery.order_id`;
    const countBaseQuery = `
    SELECT 
      COUNT(*) as totalRows 
    FROM 
      \`order\` AS o 
    JOIN 
      delivery AS d 
    ON 
      o.order_id = d.order_id
    JOIN (
      SELECT 
          o.order_id,
          COUNT(*) AS product_length,
          SUM(op.order_cnt) AS order_sum,
          MAX(p.product_title) AS product_title  
        FROM 
          \`order\` AS o
        JOIN 
          order_product AS op ON o.order_id = op.order_id 
        JOIN 
          product AS p ON op.product_id = p.product_id
        JOIN 
          users_corInfo AS uc ON uc.users_id = o.users_id
        ${whereClause} -- 서브쿼리 내부에서 조건 적용.  
        GROUP BY 
          o.order_id
      ) AS subquery 
      ON o.order_id = subquery.order_id`;

    const orderBy = "ORDER BY o.order_id DESC";

    const query = `${baseQuery} ${orderBy} LIMIT ${offset}, ${limit}`;
    const countQuery = `${countBaseQuery}`;
    const queryParams: string[] = [];

    if (newFilter.search) {
      queryParams.push(`%${newFilter.search}%`)
    }

    // 전체 데이터 크기 확인을 위한 쿼리
    connection.query(countQuery, queryParams, (countErr, countResult: any) => {
      if (countErr) {
        result(countErr, null);
        connection.releaseConnection;
        return;
      }
      const totalRows = countResult[0].totalRows;

      connection.query(query, queryParams, (err: QueryError | null, res: RowDataPacket[]) => {
        if (err) {
          console.log("에러 발생: ", err);
          result(err, null);
          connection.releaseConnection;
          return;
        } else {
          console.log(query);
          console.log(queryParams)
          const totalPages = Math.ceil(totalRows / postsPerPage);

          const responseData = {
            data: res,
            currentPage: currentPage,
            totalPages: totalPages,
            postsPerPage: postsPerPage,
          }
          // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
          console.log("상품이 갱신되었습니다: ", responseData);
          result(null, responseData);
          connection.releaseConnection;
          return;
        }
      });
    });
  }
}

export = Search;