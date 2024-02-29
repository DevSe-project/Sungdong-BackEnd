import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket, PoolConnection } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class Rae {
  // category 튜플 추가
  static create(newProduct: any, changedRaeStatus: any, result: (arg0: any, arg1: any) => void) {
    performTransaction((connection: PoolConnection) => {
      const queries = [
        "INSERT INTO rae SET ?",
        "INSERT INTO rae_product SET ?",
        "UPDATE order_product SET isRae = 1 WHERE order_product_id IN (?)"
      ];

      const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];

      function executeQuery(queryIndex: number) {
        if (queryIndex < queries.length) {
          const query = queries[queryIndex];

          // 2번째 쿼리만 객체의 개수만큼 반복하기 위한 조건
          if (queryIndex === 1 && newProduct.product2 && newProduct.product2.length > 0) {
            // 2번째 쿼리가 모두 수행될 때 넘기도록 Promise화
            const promises = newProduct.product2.map((item: any) => {
              return new Promise((resolve, reject) => {
                connection.query(query, [item], (err, res) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(res);
                  }
                });
              });
            });

            // 2번째 쿼리가 전부 수행되면 푸시 & 커밋
            Promise.all(promises)
              .then((resArray) => {
                results.push(resArray);
                executeQuery(queryIndex + 1);
              })
              .catch((err) => {
                console.log(`쿼리 실행 중 에러 발생 (인덱스 ${queryIndex}): `, err);
                connection.rollback(() => {
                  result(err, null);
                  connection.release();
                });
              });
          }
          else if (queryIndex === 2) {
            connection.query(query, [changedRaeStatus], (err, res) => {
              if (err) {
                console.log(`쿼리 실행 중 에러 발생 (인덱스 ${queryIndex}): `, err);
                connection.rollback(() => {
                  result(err, null);
                  connection.release();
                });
              } else {
                results.push(res);
                executeQuery(queryIndex + 1);
              }
            });
          }
          else {
            // 나머지 쿼리문 수행
            connection.query(query, [newProduct[`product${queryIndex + 1}`]], (err, res) => {
              if (err) {
                console.log(`쿼리 실행 중 에러 발생 (인덱스 ${queryIndex}): `, err);
                connection.rollback(() => {
                  result(err, null);
                  connection.release();
                });
              } else {
                results.push(res);
                executeQuery(queryIndex + 1);
              }
            });
          }
        } else {
          connection.commit((commitErr) => {
            if (commitErr) {
              console.log('커밋 중 에러 발생: ', commitErr);
              connection.rollback(() => {
                result(commitErr, null);
                connection.release();
              });
            } else {
              console.log('트랜잭션 성공적으로 완료: ', results);
              result(null, results);
              connection.release();
            }
          });
        }
      }

      executeQuery(0);
    });
  }

  //유저의 반품/교환 목록 불러오기
  static list(user_id: string, currentPage: any, postsPerPage: number, result: (arg0: any, arg1: any) => void) {
    const offset = (currentPage - 1) * postsPerPage;
    const limit = postsPerPage;
    // 주문 정보와 상품 정보를 조합하여 가져오는 쿼리
    const query = "SELECT * FROM rae JOIN rae_product ON rae.rae_id = rae_product.rae_id JOIN order_product ON order_product.order_product_id = rae_product.order_product_id JOIN product ON product.product_id = order_product.product_id WHERE rae.users_id = ? ORDER BY rae.rae_requestDate DESC LIMIT ?, ?";
    // 전체 데이터 크기 확인을 위한 쿼리
    const countQuery = "SELECT COUNT(*) as totalRows FROM rae JOIN rae_product ON rae.rae_id = rae_product.rae_id WHERE rae.users_id = ?";
    connection.query(countQuery, [user_id], (countErr, countResult: any) => {
      if (countErr) {
        result(countErr, null);
        connection.releaseConnection;
        return;
      }
      const totalRows = countResult[0].totalRows;
      connection.query(query, [user_id, offset, limit], (err: QueryError | null, res: RowDataPacket[]) => {
        if (err) {
          console.log(err)
          result(err, null);
          connection.releaseConnection;
          return;
        }
        else {
          const totalPages = Math.ceil(totalRows / postsPerPage);

          const responseData = {
            data: res,
            currentPage: currentPage,
            totalPages: totalPages,
          }
          // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
          console.log("상품이 갱신되었습니다: ", responseData);
          result(null, responseData);
          connection.releaseConnection;
          return;
        }
      });
    })
  }

  //관리자의 반품/교환 목록 불러오기
  static adminList(currentPage: any, postsPerPage: number, result: (arg0: any, arg1: any) => void) {
    const offset = (currentPage - 1) * postsPerPage;
    const limit = postsPerPage;
    // 주문 정보와 상품 정보를 조합하여 가져오는 쿼리
    const query = `
    SELECT 
      rae.*,
      IFNULL(subquery.product_length, 0) AS product_length,
      product_title,
      corName
    FROM
      rae
    JOIN (
      SELECT 
          rae.rae_id,
          uc.cor_corName AS corName,
          COUNT(*) AS product_length,
          MAX(p.product_title) AS product_title  
        FROM 
          rae
        JOIN 
          rae_product AS rp ON rae.rae_id = rp.rae_id 
        JOIN
          order_product AS op ON rp.order_product_id = op.order_product_id
        JOIN 
          product AS p ON op.product_id = p.product_id
        JOIN 
          users_corInfo AS uc ON uc.users_id = rae.users_id
        GROUP BY 
          rae.rae_id, uc.cor_corName
      ) AS subquery 
      ON rae.rae_id = subquery.rae_id
      ORDER BY rae.rae_id DESC LIMIT ?, ?`;
    const countQuery = "SELECT COUNT(*) as totalRows FROM rae";
    connection.query(countQuery, (countErr, countResult: any) => {
      if (countErr) {
        result(countErr, null);
        connection.releaseConnection;
        return;
      }
      const totalRows = countResult[0].totalRows;
      connection.query(query, [offset, limit], (err: QueryError | null, res: RowDataPacket[]) => {
        if (err) {
          console.log(err)
          result(err, null);
          connection.releaseConnection;
          return;
        }
        else {
          const totalPages = Math.ceil(totalRows / postsPerPage);

          const responseData = {
            data: res,
            currentPage: currentPage,
            totalPages: totalPages,
          }
          // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
          console.log("상품이 갱신되었습니다: ", responseData);
          result(null, responseData);
          connection.releaseConnection;
          return;
        }
      });
    })
  }

  //특정 rae_id들의 상품들 출력하기
  static selectProductById(order_id: any, result: (arg0: any, arg1: any) => void) {
    const query = "SELECT * FROM rae JOIN rae_product ON rae.rae_id = rae_product.rae_id JOIN order_product ON order_product.order_product_id = rae_product.order_product_id JOIN product ON order_product.product_id = product.product_id WHERE rae.rae_id IN (?)";
    connection.query(query, [order_id], (err: QueryError | null, res: RowDataPacket[]) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }
      else {
        // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
        console.log("상품이 갱신되었습니다: ", res);
        result(null, res);
        connection.releaseConnection;
        return;
      }
    });
  }

  //특정 rae_id들의 상태 변경하기
  static changeStatusbyId(obj: any, result: (arg0: any, arg1: any) => void) {
    const query = "UPDATE rae SET raeState = ?, rae_checkDate = ?,rae_cancelReason = NULL WHERE rae_id = ?";
    const promises = obj.map((item: any) => {
      return new Promise((resolve, reject) => {
        connection.query(query, [item.raeState, new Date(), item.rae_id], (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    });
    Promise.all(promises)
      .then((resArray) => {
        result(null, resArray);
        connection.releaseConnection;
      })
      .catch((err) => {
        console.log(`쿼리 실행 중 에러 발생: `, err);
        result(err, null);
        connection.releaseConnection;
      });
  }

  //특정 rae_id들에 해당하는 것들 취소 처리하기
  static changeCancelbyId(obj: any, result: (arg0: any, arg1: any) => void) {
    const query = "UPDATE rae SET raeState = ?, rae_cancelReason = ?, rae_checkDate = ? WHERE rae_id = ?";
    const promises = obj.map((item: any) => {
      return new Promise((resolve, reject) => {
        connection.query(query, [item.raeState, item.rae_cancelReason, new Date(), item.rae_id], (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    });
    Promise.all(promises)
      .then((resArray) => {
        result(null, resArray);
        connection.releaseConnection;
      })
      .catch((err) => {
        console.log(`쿼리 실행 중 에러 발생: `, err);
        result(err, null);
        connection.releaseConnection;
      });
  }

  //관리자 페이지의 필터 구성하기
  static filter(newFilter: any, currentPage: number, postsPerPage: number, result: (arg0: any, arg1: any) => void) {
    const offset = (currentPage - 1) * postsPerPage;
    const limit = postsPerPage;
    let conditions: string[] = [];

    if(newFilter.rae_type){
      conditions.push(`rp.rae_type = ${newFilter.rae_type}`);
    }

    if (newFilter.raeState) {
      conditions.push(`rae.raeState = ${newFilter.raeState}`);
    }

    if (newFilter.selectFilter && newFilter.filterValue) {
      conditions.push(`${newFilter.selectFilter} LIKE ?`);
    }

    if (newFilter.dateStart !== '' && newFilter.dateEnd !== '') {
      conditions.push(`${newFilter.raeDateType} BETWEEN '${newFilter.dateStart} 00:00:00' AND '${newFilter.dateEnd} 23:59:59'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const baseQuery = `
    SELECT 
      rae.*,
      IFNULL(subquery.product_length, 0) AS product_length,
      subquery.product_title,
      subquery.corName
    FROM
      rae
    JOIN (
        SELECT 
          rae.rae_id,
          uc.cor_corName AS corName,
          COUNT(*) AS product_length,
          MAX(p.product_title) AS product_title  
        FROM 
          rae
        JOIN 
          rae_product AS rp ON rae.rae_id = rp.rae_id 
        JOIN 
          order_product AS op ON rp.order_product_id = op.order_product_id
        JOIN 
          product AS p ON op.product_id = p.product_id
        JOIN 
          users_corInfo AS uc ON uc.users_id = rae.users_id
        ${whereClause} -- 서브쿼리 내부에서 조건 적용.
        GROUP BY 
          rae.rae_id, uc.cor_corName
      ) AS subquery ON rae.rae_id = subquery.rae_id`;

    const countBaseQuery = `
    SELECT 
      COUNT(*) as totalRows
    FROM 
      rae  
    JOIN (
      SELECT 
        rae.rae_id,
        uc.cor_corName AS corName,
        COUNT(*) AS product_length,
        MAX(p.product_title) AS product_title  
      FROM 
        rae
      JOIN 
        rae_product AS rp ON rae.rae_id = rp.rae_id 
      JOIN 
        order_product AS op ON rp.order_product_id = op.order_product_id
      JOIN 
        product AS p ON op.product_id = p.product_id
      JOIN 
        users_corInfo AS uc ON uc.users_id = rae.users_id
        ${whereClause} -- 서브쿼리 내부에서 조건 적용.
        GROUP BY 
          rae.rae_id, uc.cor_corName
      ) AS subquery ON rae.rae_id = subquery.rae_id`;

    const orderBy = "ORDER BY rae.rae_id DESC";

    const query = `${baseQuery} ${orderBy} LIMIT ${offset}, ${limit}`;
    const countQuery = `${countBaseQuery}`;
    const queryParams: string[] = [];

    if (newFilter.filterValue) {
      queryParams.push(`%${newFilter.filterValue}%`)
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

  static raeFilter(users_id:any, newFilter: any, currentPage: number, postsPerPage: number, result: (arg0: any, arg1: any) => void) {
    const offset = (currentPage - 1) * postsPerPage;
    const limit = postsPerPage;

    const baseQuery = `
    SELECT
      *
    FROM
    rae AS r
    JOIN 
      rae_product AS rp ON r.rae_id = rp.rae_id 
      JOIN order_product AS op ON op.order_product_id = rp.order_product_id 
      JOIN product AS p ON p.product_id = op.product_id`;
  
  const countBaseQuery = `
    SELECT 
      COUNT(*) as totalRows     
    FROM
      rae AS r
    JOIN 
      rae_product AS rp ON r.rae_id = rp.rae_id 
      JOIN order_product AS op ON op.order_product_id = rp.order_product_id 
      JOIN product AS p ON p.product_id = op.product_id`;
  
  const condition = `WHERE r.users_id = ?`;
  
  const conditionColumns = ["p.product_title", "p.product_brand", "p.product_id", "p.product_spec", "p.product_model"];
  const conditions = conditionColumns.filter(column => newFilter[column.split(".")[1]] !== undefined);
  const conditionString = conditions.length > 0 ? "AND " + conditions.map(condition => condition + " LIKE ?").join(" AND ") : "";
  
  const dateCondition = newFilter.dateStart !== '' && newFilter.dateEnd !== '' ?
    `AND ${newFilter.raeDateType} BETWEEN ? AND ?`
    : '';

  const typeCondition = newFilter.rae_type !== '' ?
  `AND rp.rae_type = ?`
  : '';
  const stateCondition = newFilter.raeState !== '' ?
  `AND r.raeState = ?`
  : '';
  
  const orderBy = "ORDER BY r.rae_requestDate DESC";
  
  const query = `${baseQuery} ${condition} ${conditionString} ${dateCondition} ${typeCondition} ${stateCondition} ${orderBy} LIMIT ${offset}, ${limit}`;
  const countQuery = `${countBaseQuery} ${condition} ${conditionString} ${dateCondition} ${typeCondition} ${stateCondition}`;
  
  const queryParams = [
    users_id,
    `%${newFilter.product_title}%`,
    `%${newFilter.product_brand}%`,
    `%${newFilter.product_id}%`,
    `%${newFilter.product_spec}%`,
    `%${newFilter.product_model}%`
  ];
  
  if (newFilter.dateStart !== '' && newFilter.dateEnd !== '') {
    queryParams.push(newFilter.dateStart, newFilter.dateEnd);
  }
  if (newFilter.rae_type !== ''){
    queryParams.push(newFilter.rae_type);
  }
  if (newFilter.raeState !== ''){
    queryParams.push(newFilter.raeState)
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
          const totalPages = Math.ceil(totalRows / postsPerPage);

          const responseData = {
            data: res,
            currentPage: currentPage,
            totalPages: totalPages,
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


  static deleteByIds(product: number[], result: (error: any, response: any) => void) {
    const query = "DELETE FROM cart_product WHERE cart_product_id IN (?)"
    console.log(query)
    console.log(product)
    connection.query(query, [product], (err, res) => {
      if (err) {
        console.log(`쿼리 실행 중 에러 발생: `, err);
        result(err, null);
        connection.releaseConnection;
      } else {
        console.log('성공적으로 삭제 완료: ', res);
        result(null, res);
        connection.releaseConnection;
      }
    })
  }
}

export = Rae;