import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();

class User {

    // user 튜플 추가 - 회원가입
    static create(newUser: any, result: (arg0: any, arg1: any) => void) {
        connection.beginTransaction((err) => {
            if (err) {
                console.log('트랜잭션 시작 중 에러 발생: ', err);
                result(err, null);
                return;
            }

            const queries = [
                "INSERT INTO users SET ?",
                "INSERT INTO users_info SET ?",
                "INSERT INTO users_corInfo SET ?",
                "INSERT INTO users_address SET ?",
            ];

            const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];

            function executeQuery(queryIndex: number) {
                if (queryIndex < queries.length) {
                    connection.query(queries[queryIndex], newUser[`users${queryIndex + 1}`], (err, res) => {
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
    // user 생성 시 UserID 중복검사
    static findByUserID(userID: any, result: (arg0: QueryError | { kind: string; } | null, arg1: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => void) {
        connection.query('SELECT * FROM users WHERE userId = ?', userID, (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            } else {
                if (res.length > 0) {
                    console.log("중복된 아이디: ", res[0]);
                    result(null, res[0]); // 중복된 사용자 정보 반환
                } else {
                    // 결과가 없을 시
                    result({ kind: "not_found" }, null);
                }
            }
        });
    }
    // userID 찾기
    static findUserID(user: any, result: (arg0: QueryError | string | null, arg1: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => void) {
        connection.query('SELECT a.userId FROM users a JOIN users_corInfo b ON a.users_id = b.users_id WHERE b.cor_ceoName = ? AND b.cor_num = ?', [user.cor_ceoName, user.cor_num], (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            } else {
                if (res.length > 0) {
                    console.log("찾은 아이디: ", res[0]);
                    result(null, res[0]); // 찾은 사용자 정보 반환
                } else {
                    // 결과가 없을 시
                    result("찾을 수 없습니다.", null);
                }
            }
        });
    }
    // userPw 찾기
    static findUserPw(user: any, result: (arg0: QueryError | string | null, arg1: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => void) {
        connection.query('SELECT a.userPassword FROM users a JOIN users_corInfo b ON a.users_id = b.users_id WHERE a.userId = ? AND b.cor_num = ?', [user.userId, user.cor_num], (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            } else {
                if (res.length > 0) {
                    console.log("찾은 비밀번호: ", res[0]);
                    result(null, res[0]); // 찾은 사용자 정보 반환
                } else {
                    // 결과가 없을 시
                    result("찾을 수 없습니다.", null);
                }
            }
        });
    }

    // user의 id로 user 모든 정보 조회 - 마이페이지
    static findAllUserInfo(user: any, result: (arg0: QueryError | string | null, arg1: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => void) {
        connection.query('SELECT * FROM users a JOIN users_info b ON a.users_id = b.users_id JOIN users_corInfo c ON a.users_id = c.users_id JOIN users_address d ON a.users_id = d.users_id WHERE a.userType_id = ? AND a.users_id = ?', [user.userType_id, user.users_id], (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][]) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            } else {
                if (res.length > 0) {
                    console.log("찾은 유저: ", res[0]);
                    result(null, res[0]); // 찾은 사용자 정보 반환
                } else {
                    // 결과가 없을 시
                    result("찾을 수 없습니다.", null);
                }
            }
        });
    }
    // 로그인
    static login(user: { userId: any; userPassword: any; }, result: (arg0: QueryError | { kind: string; } | null, arg1: any) => void) {
        connection.query('SELECT * FROM users WHERE userId = ? AND userPassword = ?', [user.userId, user.userPassword], (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, {});
                return;
            }
            if (res.length) {
                console.log("다음 회원이 로그인을 시도합니다: ", res[0]);
                result(null, res[0]);
                return;
            }
            // 결과가 없을 시 
            result(err, {});
        });
    }

    // user 생성 id로 조회
    static findByID(userID: any, result: (arg0: { kind: string; } | QueryError | null, arg1: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => void) {
        connection.query('SELECT * FROM users WHERE userId = ?', userID, (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            }

            if (res.length) {
                console.log("다음 회원을 찾았습니다: ", res[0]);
                result(null, res[0]);
                return;
            }
            // 결과가 없을 시 
            result({ kind: "not_found" }, null);
        });
    }
    /*----------------------------- 유저 관리 ----------------------------------*/
    // user 전체 조회
    static getAll(result: (arg0: QueryError | null, arg1: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => void) {
        const query = `SELECT * FROM users a 
        JOIN users_info b 
            ON a.users_id = b.users_id 
        JOIN users_corInfo c 
            ON a.users_id = c.users_id 
        JOIN users_address d 
            ON a.users_id = d.users_id`

        connection.query(query, (err: QueryError | null, res: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            }
            console.log("가입된 모든 회원들: ", res);
            result(null, res);
        });
    }

    // 특정 user 조회 - 필터링
    static filteredUser(user: any, result: (error: QueryError | Error | null, data: RowDataPacket[] | null) => void) {
        const query = `SELECT * FROM users USER 
        JOIN users_info INFO ON USER.users_id = INFO.users_id 
        JOIN users_corInfo COR ON USER.users_id = COR.users_id 
        JOIN users_address ADDR ON USER.users_id = ADDR.users_id 
        WHERE cor_ceoName LIKE ?
            AND cor_corName LIKE ?
                AND cor_num LIKE ?
                    AND USER.userType_id LIKE ?
                        AND INFO.grade LIKE ? `;

        connection.query(query, [`% ${user.cor_ceoName}% `, ` % ${user.cor_corName}% `, ` % ${user.cor_num}% `, ` % ${user.userType_id}% `, ` % ${user.grade}% `], (err: QueryError | Error | null, res: RowDataPacket[]) => {
            if (err) {
                console.error("에러 발생: ", err);
                result(err, null);
                return;
            }
            if (res.length === 0) {
                const noMatchingUserError = new Error("조건에 일치하는 유저가 없습니다.");
                console.error(noMatchingUserError.message);
                result(noMatchingUserError, null);
                return;
            }
            console.log("필터링 된 유저: ", res);
            result(null, res);
        });
    }
    // 유저 정렬 - 정렬
    static sortedUser(user: any, result: (error: QueryError | Error | null, data: RowDataPacket[] | null) => void) {
        // 사용자 입력 값으로부터 컬럼 및 정렬 방식을 동적으로 생성
        const orderByColumns = [user.first, user.second, user.third].filter(Boolean); // 비어있는 값 제거
        if (orderByColumns.length === 0) {
            // 정렬할 컬럼이 없으면 에러 처리
            const noOrderByError = new Error("정렬할 컬럼이 지정되지 않았습니다.");
            console.error(noOrderByError.message);
            result(noOrderByError, null);
            return;
        }

        const orderByClause = orderByColumns.map(column => `${column} ASC`).join(', ');
        // SQL 쿼리 생성
        const query = `SELECT * FROM users USER 
        JOIN users_info INFO ON USER.users_id = INFO.users_id 
        JOIN users_corInfo COR ON USER.users_id = COR.users_id 
        JOIN users_address ADDR ON USER.users_id = ADDR.users_id 
        ORDER BY ${orderByClause} `;

        connection.query(query, (err: QueryError | Error | null, res: RowDataPacket[]) => {
            if (err) {
                console.error("에러 발생: ", err);
                result(err, null);
                return;
            }
            if (res.length === 0) {
                const noMatchingUserError = new Error("조건에 일치하는 유저가 없습니다.");
                console.error(noMatchingUserError.message);
                result(noMatchingUserError, null);
                return;
            }
            console.log("정렬 된 유저: ", res);
            result(null, res);
        });
    }


    /*------------------------------코드-----------------------------*/

    // user 코드 조회
    static getAllCode(result: (arg0: QueryError | null, arg1: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => void) {
        connection.query('SELECT * FROM users_code', (err: QueryError | null, res: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            }
            console.log("생성된 모든 코드들: ", res);
            result(null, res);
        });
    }
    // 코드 생성
    static generateCode(code: any, result: (err: QueryError | null, result: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => any) {
        connection.query('INSERT INTO users_code SET ?', code, (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][]) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            }
            console.log("생성된 코드: ", code);
            result(null, res[0]);
        });
    }
    //코드 검사
    static checkCode(code: any, result: (err: QueryError | null, result: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => any) {
        connection.query('SELECT user_code FROM users_code WHERE user_code = ?', code, (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][]) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            }
            console.log("확인된 코드: ", code);
            result(null, res[0]);
        });
    }
    //코드 삭제
    static removeCode(code: any, result: (arg0: QueryError | null, arg1: any) => void) {
        connection.query('DELETE FROM users_code WHERE user_code = ?', code.user_code, (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }
            console.log("해당 코드가 정상적으로 삭제되었습니다: ", code);
            result(null, res);
        });
    }
    /*----------------------------------------------------------*/
    // user id로 수정
    static updateByID(id: any, user: { email: any; name: any; }, result: (arg0: QueryError | { kind: string; } | null, arg1: any) => void) {
        connection.query('UPDATE users SET email = ?, name = ? WHERE userId = ?',
            [user.email, user.name, id], (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
                if (err) {
                    console.log("에러 발생: ", err);
                    result(err, null);
                    return;
                }
                if (res.length == 0) {
                    // id 결과가 없을 시 
                    result({ kind: "not_found" }, null);
                    return;
                }
                console.log("회원을 찾았습니다: ", { id: id, ...user });
                result(null, { id: id, ...user });
            });
    }
    // user id로 삭제
    static remove(id: any, result: (arg0: QueryError | { kind: string; } | null, arg1: any) => void) {
        connection.query('DELETE FROM users WHERE id = ?', id, (err: QueryError | { kind: string; } | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }
            if (res.length == 0) {
                // id 결과가 없을 시 
                result({ kind: "not_found" }, null);
                return;
            }
            console.log("해당 ID의 회원이 정상적으로 삭제되었습니다: ", id);
            result(null, res);
        });
    }
    // user 전체 삭제
    static removeAll(result: (arg0: { kind: string; } | null, arg1: any) => void) {
        connection.query('DELETE FROM users', (err: any, res: { affectedRows: number; }) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }
            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }
            console.log(`${res.affectedRows} 명의 회원을 삭제하였습니다.`);
            result(null, res);
        });
    }
    /*-------------------------------------------------------------*/
}

export = User;