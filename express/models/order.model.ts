import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket, PoolConnection } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class Order {
    // category 튜플 추가
    static create(newProduct: any, result: (arg0: any, arg1: any) => void) {
        performTransaction((connection: PoolConnection) => {
            const queries = [
                "INSERT INTO `order` SET ?",
                "INSERT INTO order_product SET ?",
                "INSERT INTO delivery SET ?"
            ];

            const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];

            function executeQuery(queryIndex: number) {
                if (queryIndex < queries.length) {
                    const query = queries[queryIndex];

                    // 2번째 쿼리만 객체의 개수만큼 반복하기 위한 조건
                    if (queryIndex === 1 && newProduct[0].product2 && newProduct[0].product2.length > 0) {
                        // 2번째 쿼리가 모두 수행될 때 넘기도록 Promise화
                        const promises = newProduct[0].product2.map((item: any) => {
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
                                executeQuery(queryIndex + 1); // Proceed to the next query
                            })
                            .catch((err) => {
                                console.log(`쿼리 실행 중 에러 발생 (인덱스 ${queryIndex}): `, err);
                                connection.rollback(() => {
                                    result(err, null);
                                    connection.release();
                                });
                            });
                    } else {
                        // 나머지 쿼리문 수행
                        connection.query(query, [newProduct[0][`product${queryIndex + 1}`]], (err, res) => {
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

            executeQuery(0); // Start with the first query
        });
    }
    static list(user_id: string, result: (arg0: any, arg1: any) => void) {
        const query = `SELECT * FROM order JOIN order_product ON order.order_id = order_product.order_id JOIN product ON product.product_id = cart_product.product_id WHERE cart.users_id = ?`;
        connection.query(query, user_id, (err: QueryError | null, res: RowDataPacket[]) => {
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
    static findList(user_id: string, result: (arg0: any, arg1: any) => void) {
        const query = "SELECT * FROM order_product JOIN product ON order_product.product_id = product.product_id WHERE order_id = (SELECT order.order_id FROM `order` JOIN delivery ON order.order_id = delivery.order_id WHERE order.users_id = ? ORDER BY order.order_date DESC LIMIT 1)";
        connection.query(query, user_id, (err: QueryError | null, res: RowDataPacket[]) => {
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
    static findOne(userData: any, result: (arg0: any, arg1: any) => void) {
        const query = "SELECT * FROM `order` JOIN delivery ON order.order_id = delivery.order_id WHERE order.users_id = ? ORDER BY order.order_date DESC LIMIT 1";
        connection.query(query, userData, (err: QueryError | null, res: RowDataPacket[]) => {
            try {
                if (err) {
                    console.log("에러 발생: ", err);
                    result(err, null);
                } else {
                    console.log("해당 유저의 가장 마지막 주문을 불렀습니다.: ", res);
                    result(null, res);
                }
            } finally {
                connection.releaseConnection; // Release the connection in a finally block
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

export = Order;