import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket, PoolConnection } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class Cart {
    // category 튜플 추가
    static create(newProduct:any, result: (arg0: any, arg1: any) => void) {
        performTransaction((connection: PoolConnection) => {
            const queries = [
                "INSERT INTO cart SET ?",
                "INSERT INTO cart_product SET ?",
                "UPDATE cart SET cart_totalAmount = (SELECT SUM(cart_amount) AS total FROM cart_product WHERE cart.cart_id = cart_product.cart_id)"
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
    static list(user_id: string, result: (arg0: any, arg1: any) => void) {
      const query = `SELECT * FROM cart JOIN cart_product ON cart.cart_id = cart_product.cart_id JOIN product ON product.product_id = cart_product.product_id WHERE cart.users_id = ?`;
        connection.query(query, user_id, (err: QueryError | null, res:RowDataPacket[]) => {
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
}

export = Cart;