import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket, PoolConnection } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class Product {
  // category 튜플 추가
  static create(newProduct: any, result: (arg0: any, arg1: any) => void) {
    performTransaction((connection: PoolConnection) => {
      const queries = [
        "INSERT INTO product SET ?",
        "INSERT INTO product_option SET ?",
      ];
      const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];
      function executeQuery(queryIndex: number) {
        if (queryIndex < queries.length) {
          connection.query(queries[queryIndex], newProduct[`product${queryIndex + 1}`], (err, res) => {

            if (err) {
              console.log(`쿼리 실행 중 에러 발생 (인덱스 ${queryIndex}): `, err);
              connection.rollback(() => {
                result(err, null);
                connection.release();
                return;
              });
            } else {
              results.push(res);
              executeQuery(queryIndex + 1);
            }
          });
        } else {
          connection.commit((commitErr) => {
            if (commitErr) {
              console.log('커밋 중 에러 발생: ', commitErr);
              connection.rollback(() => {
                result(commitErr, null);
                connection.release();
                return;
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
  static list(userType_id: number, currentPage: any, postsPerPage: any, result: (arg0: any, arg1: any) => void) {
    const offset: number = (currentPage - 1) * postsPerPage;
    const limit: number = postsPerPage;
    const query = `
    SELECT 
      p.*,
      po.*, 
      p.product_price * (1-p.product_discount/100) * (SELECT (1-userType_discount/100) FROM users_type WHERE userType_id = ?) AS product_amount,
      ((p.product_price - (p.product_price * (1-p.product_discount/100) * (SELECT (1-userType_discount/100) FROM users_type WHERE userType_id = ?)))/p.product_price)*100 AS discount_amount
    FROM product AS p 
    JOIN product_option AS po 
      ON p.product_id = po.product_id
    ORDER BY p.product_created DESC LIMIT ?, ?`;
    
    // 전체 데이터 크기 확인을 위한 쿼리
    const countQuery = "SELECT COUNT(*) as totalRows FROM product";
    connection.query(countQuery, (countErr, countResult: any) => {
      if (countErr) {
        result(countErr, null);
        connection.releaseConnection;
        return;
      }
      const totalRows = countResult[0].totalRows;
      connection.query(query, [userType_id,userType_id, offset, limit], (err: QueryError | null, res: RowDataPacket[]) => {
        if (err) {
          console.log("에러 발생: ", err);
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


  static relate(userType_id:number, categoryId: string, currentPage: any, postsPerPage: any, result: (arg0: any, arg1: any) => void) {
    const offset: number = (currentPage - 1) * postsPerPage;
    const limit: number = postsPerPage;
    const query = `
    SELECT 
      p.*,
      po.*, 
      p.product_price * (1-p.product_discount/100) * (SELECT (1-userType_discount/100) FROM users_type WHERE userType_id = ?) AS product_amount,
      ((p.product_price - (p.product_price * (1-p.product_discount/100) * (SELECT (1-userType_discount/100) FROM users_type WHERE userType_id = ?)))/p.product_price)*100 AS discount_amount
    FROM product AS p 
    JOIN product_option AS po 
      ON p.product_id = po.product_id
    WHERE p.parentsCategory_id = ? 
    ORDER BY p.product_created DESC LIMIT ${offset}, ${limit}`;
    
    // 전체 데이터 크기 확인을 위한 쿼리
    const countQuery = "SELECT COUNT(*) as totalRows FROM product";
    connection.query(countQuery, (countErr, countResult: any) => {
      if (countErr) {
        result(countErr, null);
        connection.releaseConnection;
        return;
      }
      const totalRows = countResult[0].totalRows;
      connection.query(query, [userType_id, userType_id, categoryId], (err: QueryError | null, res: RowDataPacket[]) => {
        if (err) {
          console.log("에러 발생: ", err);
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


  static filter(newFilter: any, currentPage: number, postsPerPage: number, result: (arg0: any, arg1: any) => void) {
    const offset = (currentPage - 1) * postsPerPage;
    const limit = postsPerPage;

    const baseQuery = "SELECT * FROM product JOIN product_option ON product.product_id = product_option.product_id";
    const countBaseQuery = "SELECT COUNT(*) as totalRows FROM product JOIN product_option ON product.product_id = product_option.product_id";
    
    const conditionColumns = ["product.product_title", "product.product_brand", "product.product_id"];
    const conditions = conditionColumns.filter(column => newFilter[column.split(".")[1]] !== undefined);
    const conditionString = conditions.length > 0 ? "WHERE " + conditions.map(condition => condition + " LIKE ?").join(" AND ") : "";
    

    const conditionFindParentsCategory = newFilter.parentsCategory_id ? `AND product.parentsCategory_id = ?` : '';
    const conditionFindCategory = newFilter.category_id ? `AND product.category_id = ?` : '';
    const conditionProductState = newFilter.product_state ? `AND product.product_state IN (?)` : '';
    const conditionProductSupply = newFilter.product_supply ? `AND product.product_supply < ?` : '';
    const dateCondition = newFilter.dateType !== '' ? 
    newFilter.dateType === "created" ? 
        `AND product.product_created BETWEEN '${newFilter.dateStart} 00:00:00' AND '${newFilter.dateEnd} 23:59:59'` : 
        `AND product.product_updated BETWEEN '${newFilter.dateStart}' AND '${newFilter.dateEnd}'` : 
    '';


    const orderBy = "ORDER BY product.product_id DESC";
    
    const query = `${baseQuery} ${conditionString} ${conditionFindParentsCategory} ${conditionFindCategory} ${conditionProductState} ${conditionProductSupply} ${dateCondition} ${orderBy} LIMIT ${offset}, ${limit}`;
    const countQuery = `${countBaseQuery} ${conditionString} ${conditionFindParentsCategory} ${conditionFindCategory} ${conditionProductState} ${conditionProductSupply} ${dateCondition}`;
    const queryParams = [
        `%${newFilter.product_title || ''}%`,
        `%${newFilter.product_brand || ''}%`,
        `%${newFilter.product_id || ''}%`,
    ];

    if (newFilter.parentsCategory_id) {
        queryParams.push(newFilter.parentsCategory_id);
    }

    if (newFilter.category_id) {
        queryParams.push(newFilter.category_id);
    }

    if (newFilter.product_state) {
        queryParams.push(newFilter.product_state);
    }

    if (newFilter.product_supply) {
        queryParams.push(newFilter.product_supply);
    }

    // 전체 데이터 크기 확인을 위한 쿼리
    connection.query(countQuery, queryParams, (countErr, countResult: any) => {
        if (countErr) {
            result(countErr, null);
            connection.releaseConnection;
            return;
        }
        const totalRows = countResult[0].totalRows;
        console.log(totalRows)
        console.log(query)
        console.log(queryParams)

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

  //관리자페이지의 모듈 - 개수 불러오기
  static adminModule(
    result: (arg0: any, arg1: any) => void
  ) {
    // 주문 정보와 상품 정보를 조합하여 가져오는 쿼리
    const query = `
    SELECT 
      (SELECT COUNT(*) FROM product WHERE product_state = '판매준비') AS prepare,
      (SELECT COUNT(*) FROM product WHERE product_state = '판매중') AS selling,
      (SELECT COUNT(*) FROM product WHERE product_state = '품절') AS soldout`;
      connection.query(
        query,
        (err: QueryError | null, res: RowDataPacket[]) => {
          if (err) {
            console.log(err);
            result(err, null);
            connection.releaseConnection;
            return;
          } else {
            console.log("상품이 갱신되었습니다: ", res);
            result(null, res);
            connection.releaseConnection;
            return;
          }
        }
      );
    }


  static edit(newProduct: any, result: (error: any, response: any) => void) {
    performTransaction((connection: PoolConnection) => {

      const queries = [
        "UPDATE product SET ? WHERE product_id = ?",
        "UPDATE product_option SET ? WHERE product_id = ?",
      ];

      const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];

      function executeQuery(queryIndex: number) {
        if (queryIndex < queries.length) {
          connection.query(queries[queryIndex], [newProduct[`product${queryIndex + 1}`], newProduct[`product${queryIndex + 1}`].product_id], (err, res) => {
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
  //재고 감소
  static lowSupply(newProducts: any[]): Promise<any> {
    const updateQuery = "UPDATE product SET product_supply = ? WHERE product_id = ?";
    const promises: Promise<any>[] = [];

    newProducts.forEach((item) => {
      const promise = new Promise((resolve, reject) => {
        connection.query(updateQuery, [item.product_supply, item.product_id], (err, res) => {
          if (err) {
            console.log(`쿼리 실행 중 에러 발생: `, err);
            reject(err);
          } else {
            console.log(`성공적으로 변경 완료: `, res);
            resolve(res);
          }
        });
      });

      promises.push(promise);
    });

    return Promise.all(promises);
  }
  //재고 조사
  static checkedSupply(newProducts: any[]): Promise<any> {
    const updateQuery = "SELECT product_title, product_supply FROM product WHERE product_id = ? AND product_supply > 1";
    const promises: Promise<any>[] = [];

    newProducts.forEach((item) => {
      const promise = new Promise((resolve, reject) => {
        connection.query(updateQuery, [item.product_id], (err: QueryError | null, res: any) => {
          if (err) {
            console.log(`쿼리 실행 중 에러 발생: `, err);
            reject(err);
          } else {
            if (res && res.length > 0 && res[0].product_supply > 1) {
              console.log(`성공적으로 조사 완료: `, res);
              resolve(res);
            } else {
              const errorMessage = `재고가 부족한 상품이 있어 주문이 불가합니다\n재고 부족 : ${item.product_title}`;
              console.log(errorMessage);
              reject(new Error(errorMessage));
            }
          }
        });
      });

      promises.push(promise);
    });

    return Promise.all(promises);
  }
  static deleteByIds(product: string, result: (error: any, response: any) => void) {
    performTransaction((connection: PoolConnection) => {

      const queries = [
        "DELETE FROM product WHERE product_id = ?",
        "DELETE FROM product_option WHERE product_id = ?"
      ]

      const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];

      function executeQuery(queryIndex: number) {
        if (queryIndex < queries.length) {
          connection.query(queries[queryIndex], product, (err, res) => {
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
    })
  }
  //엑셀 업로딩
  static importExcel(sheetData: any[][], result: (error: any, response: any) => void) {
    performTransaction((connection: PoolConnection) => {
        const queries = [
            "INSERT INTO product SET ?",      // 첫 번째 시트의 쿼리
            "INSERT INTO product_option SET ?", // 두 번째 시트의 쿼리
        ];

        const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];

        function executeSheetQuery(sheetIndex: number) {
            if (sheetIndex < sheetData.length) {
                const currentSheetData = sheetData[sheetIndex];
                let queryCounter = 0; // 현재 시트의 데이터를 처리하는 카운터

                function executeQuery() {
                    if (queryCounter < currentSheetData.length) {
                        connection.query(queries[sheetIndex], currentSheetData[queryCounter], (err, res) => {
                            if (err) {
                                console.log(`쿼리 실행 중 에러 발생 (시트 ${sheetIndex}, 인덱스 ${queryCounter}): `, err);
                                connection.rollback(() => {
                                    result(err, null);
                                    connection.release();
                                });
                            } else {
                                results.push(res);
                                queryCounter++;
                                executeQuery(); // 다음 행 처리
                            }
                        });
                    } else {
                        executeSheetQuery(sheetIndex + 1); // 현재 시트의 모든 데이터 처리 후 다음 시트 처리
                    }
                }

                executeQuery();
            } else {
                // 모든 시트 처리 완료 후 커밋
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

        executeSheetQuery(0); // 첫 번째 시트부터 처리 시작
    });
  }
}

export = Product;