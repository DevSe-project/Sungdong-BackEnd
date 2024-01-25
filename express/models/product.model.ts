import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();

class Product {
    // category 튜플 추가
    static create(newProduct:any, result: (arg0: any, arg1: any) => void) {
        connection.beginTransaction((err) => {
        if (err) {
        console.log('트랜잭션 시작 중 에러 발생: ', err);
        result(err, null);
        return;
        }
    
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
                });
            } else {
                console.log('트랜잭션 성공적으로 완료: ', results);
                result(null, results);
            }
            });
        }
        }
        executeQuery(0);
    });
    }
    static list(result: (arg0: any, arg1: any) => void) {
      const query = `SELECT * FROM product JOIN product_option ON product.product_id = product_option.product_id`;
        connection.query(query, (err: QueryError | null, res:RowDataPacket[]) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            }
            else {
                // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
                console.log("상품이 갱신되었습니다: ", res);
                result(null, res);
                return;
            }
        });
        }
        
        static edit(newProduct: any, result: (error: any, response: any) => void) {
        connection.beginTransaction((err) => {
        if (err) {
        console.log('트랜잭션 시작 중 에러 발생: ', err);
        result(err, null);
        return;
        }
    
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
                });
            } else {
                console.log('트랜잭션 성공적으로 완료: ', results);
                result(null, results);
            }
            });
        }
        }
        executeQuery(0);
    });
    }
    static deleteByIds(product: string, result: (error: any, response: any) => void) {
    connection.beginTransaction((err) => {
        if (err) {
        console.log('트랜잭션 시작 중 에러 발생: ', err);
        result(err, null);
        return;
        }

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
                    });
                } else {
                    console.log('트랜잭션 성공적으로 완료: ', results);
                    result(null, results);
                }
                });
            }
            }
            executeQuery(0);
        })
    }
}

export = Product;