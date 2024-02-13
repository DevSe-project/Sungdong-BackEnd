import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, ProcedureCallPacket, PoolConnection, OkPacket } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class User {

  // user 튜플 추가 - 회원가입
  static create(newUser: any, result: (arg0: any, arg1: any) => void) {
    performTransaction((connection: PoolConnection) => {

      const queries = [
        "INSERT INTO users SET ?",
        "INSERT INTO users_info SET ?",
        "INSERT INTO users_corInfo SET ?",
        "INSERT INTO users_address SET ?",
        "INSERT INTO cart SET ?",
        "INSERT INTO estimateBox SET ?",
      ];

      const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];

      function executeQuery(queryIndex: number) {
        if (queryIndex < queries.length) {
          connection.query(queries[queryIndex], newUser[`users${queryIndex + 1}`], (err, res) => {
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
  // user 생성 시 UserID 중복검사
  static findByUserID(userID: any, result: (arg0: QueryError | { kind: string; } | null, arg1: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => void) {
    connection.query('SELECT * FROM users WHERE userId = ?', userID, (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      } else {
        if (res.length > 0) {
          console.log("중복된 아이디: ", res[0]);
          result(null, res[0]); // 중복된 사용자 정보 반환
          connection.releaseConnection;
        } else {
          // 결과가 없을 시
          result({ kind: "not_found" }, null);
          connection.releaseConnection;
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
        connection.releaseConnection;
        return;
      } else {
        if (res.length > 0) {
          console.log("찾은 아이디: ", res[0]);
          result(null, res[0]); // 찾은 사용자 정보 반환
          connection.releaseConnection;
        } else {
          // 결과가 없을 시
          result("찾을 수 없습니다.", null);
          connection.releaseConnection;
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
        connection.releaseConnection;
        return;
      } else {
        if (res.length > 0) {
          console.log("찾은 비밀번호: ", res[0]);
          result(null, res[0]); // 찾은 사용자 정보 반환
          connection.releaseConnection;
        } else {
          // 결과가 없을 시
          result("찾을 수 없습니다.", null);
          connection.releaseConnection;
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
        connection.releaseConnection;
        return;
      } else {
        if (res.length > 0) {
          console.log("찾은 유저: ", res[0]);
          result(null, res[0]); // 찾은 사용자 정보 반환
          connection.releaseConnection;
        } else {
          // 결과가 없을 시
          result("찾을 수 없습니다.", null);
          connection.releaseConnection;
        }
      }
    });
  }
  // Welcome Module에 필요한 user(users_corName), order(orderState)정보 조회
  static welcomeModuleInfo(user: any, result: (arg0: QueryError | string | null, arg1: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => void) {
    connection.query(`
      SELECT 
        u.users_id AS users_id,
        uc.cor_corName AS cor_corName, 
        COUNT(o.order_id) AS ordersCount,
        SUM(CASE WHEN o.orderState = 2 THEN 1 ELSE 0 END) AS preparing_orders,
        SUM(CASE WHEN o.orderState = 3 THEN 1 ELSE 0 END) AS shipping_orders,
        SUM(CASE WHEN o.orderState = 4 THEN 1 ELSE 0 END) AS completed_orders
      FROM 
        users u 
      JOIN 
        users_corInfo uc ON u.users_id = uc.users_id 
      LEFT JOIN 
        \`order\` o ON u.users_id = o.users_id 
      GROUP BY 
        u.users_id, uc.cor_corName;
      `, user.users_id, (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][]) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      } else {
        if (res.length > 0) {
          console.log("찾은 유저: ", res[0]);
          result(null, res[0]); // 찾은 사용자 정보 반환
          connection.releaseConnection;
        } else {
          // 결과가 없을 시
          result("찾을 수 없습니다.", null);
          connection.releaseConnection;
        }
      }
    });
  }
  // 로그인
  static login(user: { userId: any; userPassword: any; }, result: (arg0: QueryError | Error | null, arg1: any) => void) {
    connection.query('SELECT * FROM users WHERE userId = ? AND userPassword = ?', [user.userId, user.userPassword], (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }
      if (res.length) {
        console.log("다음 회원이 로그인을 시도합니다: ", res[0]);
        result(null, res[0]);
        connection.releaseConnection;
        return;
      } else {
        // 결과가 없을 시 
        result(new Error("아이디와 비밀번호를 다시 확인해주세요"), null);
        connection.releaseConnection;
        return;
      }
    });
  }

  // user 생성 id로 조회
  static findByID(userID: any, result: (arg0: Error | QueryError | null, arg1: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => void) {
    connection.query('SELECT * FROM users WHERE userId = ?', userID, (err: Error | QueryError | null, res: any) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }

      if (res.length > 0) {
        console.log("중복된 아이디입니다: ", res[0]);
        const errorMessage = `중복된 아이디 입니다 : ${res[0].userId}`
        result(new Error(errorMessage), res[0].userId);
        connection.releaseConnection;
        return;
      }
      else {
        console.log("사용 가능한 아이디입니다", null);
        // 결과가 없을 시 
        result(null, null);
      }
      connection.releaseConnection;
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
        connection.releaseConnection;
        return;
      }
      console.log("가입된 모든 회원들: ", res);
      result(null, res);
      connection.releaseConnection;
    });
  }

  // 페이지와 포스팅 개수에 따른 user 조회
  static getFindUserIfCondition(currentPage: number, itemsPerPage: number, result: (error: any, data: any) => void) {
    const offset = (currentPage - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const query = `
        SELECT *
        FROM users u
        JOIN users_info ui ON u.users_id = ui.users_id
        JOIN users_address ua ON ui.users_id = ua.users_id
        JOIN users_corInfo uc ON ua.users_id = uc.users_id
        JOIN managers m ON ui.managers_id = m.managers_id
        JOIN managers_info mi ON m.managers_id = mi.managers_id
        LIMIT ?, ?
      `
    const countQuery = `
        SELECT COUNT(*) as totalRows 
        FROM users u
        JOIN users_info ui ON u.users_id = ui.users_id
        JOIN users_address ua ON ui.users_id = ua.users_id
        JOIN users_corInfo uc ON ua.users_id = uc.users_id
      `
    connection.query(countQuery, (err, countResult: any) => {
      if (err) {
        result(err, null);
        return;
      }
      const totalRows = countResult[0].totalRows
      connection.query(query, [offset, limit], (err: QueryError | null, res: RowDataPacket[]) => {
        if (err) {
          console.log("에러 발생: ", err);
          result(err, null);
          return;
        } else {
          const totalPages = Math.ceil(totalRows / itemsPerPage);
          const responseData = {
            data: res,
            currentPage: currentPage,
            totalPages: totalPages,
          }
          // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
          console.log("고객정보가 갱신되었습니다: ", responseData);
          result(null, responseData);
        }
      });
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
        connection.releaseConnection;
        return;
      }
      if (res.length === 0) {
        const noMatchingUserError = new Error("조건에 일치하는 유저가 없습니다.");
        console.error(noMatchingUserError.message);
        result(noMatchingUserError, null);
        connection.releaseConnection;
        return;
      }
      console.log("필터링 된 유저: ", res);
      result(null, res);
      connection.releaseConnection;
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
      connection.releaseConnection;
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
        connection.releaseConnection;
        return;
      }
      if (res.length === 0) {
        const noMatchingUserError = new Error("조건에 일치하는 유저가 없습니다.");
        console.error(noMatchingUserError.message);
        result(noMatchingUserError, null);
        connection.releaseConnection;
        return;
      }
      console.log("정렬 된 유저: ", res);
      result(null, res);
      connection.releaseConnection;
    });
  }

  // 고객 정보 수정(단일 또는 여러 고객)
  static updateUser(user: any, result: (error: any, response: any) => void) {
    // 풀에서 연결을 가져옴
    connection.getConnection((err, conn) => {
      if (err) {
        console.log('연결 가져오기 중 에러 발생:', err);
        result(err, null);
        return;
      }
      // 연결에서 트랜잭션 시작
      conn.beginTransaction((err) => {
        if (err) {
          console.log('트랜잭션 시작 중 에러 발생:', err);
          result(err, null);
          return;
        }
        // const userType_id = user.userType_id === '1' ? 1 : 2;
        const hasCMS = user.hasCMS === 'true' ? true : false;
        // 사용자 정보 업데이트 쿼리 실행
        conn.query(`UPDATE users_address
        SET zonecode = ?, roadAddress = ?, bname = ?, buildingName = ?, jibunAddress = ?, addressDetail = ?
        WHERE address_id = ?`, [user.zonecode, user.roadAddress, user.bname, user.buildingName, user.jibunAddress, user.addressDetail, user.address_id], (error, results, fields) => {
          if (error) {
            conn.rollback(() => {
              console.log('쿼리 실행 중 에러 발생:', error);
              result(error, null);
            });
            return;
          }
          conn.query(`UPDATE users_info
          SET grade = ?, email = ?, emailService = ?, name = ?, tel = ?, smsService = ?, hasCMS = ?, isBanned = ?
          WHERE users_info_id = ?`, [user.grade, user.email, user.emailService, user.name, user.tel, user.smsService, hasCMS, user.isBanned, user.users_info_id], (error, results, fields) => {
            if (error) {
              conn.rollback(() => {
                console.log('쿼리 실행 중 에러 발생:', error);
                result(error, null);
              });
              return;
            }
            conn.query(`UPDATE users_corInfo
            SET cor_ceoName = ?, cor_corName = ?, cor_sector = ?, cor_category = ?, cor_num = ?, cor_fax = ?, cor_tel = ?
            WHERE users_id = ?`, [user.cor_ceoName, user.cor_corName, user.cor_sector, user.cor_category, user.cor_num, user.cor_fax, user.cor_tel, user.users_id], (error, results, fields) => {
              if (error) {
                conn.rollback(() => {
                  console.log('쿼리 실행 중 에러 발생:', error);
                  result(error, null);
                });
                return;
              }
              conn.query(`UPDATE users 
              SET userType_id = ?, userId = ?, userPassword = ?
              WHERE users_id = ?`, [user.userType_id, user.userId, user.userPassword, user.users_id], (error, results, fields) => {
                if (error) {
                  conn.rollback(() => {
                    console.log('쿼리 실행 중 에러 발생:', error);
                    result(error, null);
                  });
                  return;
                }
                conn.query(`UPDATE managers
                SET managers_id = ?, managerPassword = ?, managerId = ?
                WHERE managers_id = ?`, [user.managers_id, user.managerPassword, user.managerId, user.managers_id], (error, results, fields) => {
                  if (error) {
                    conn.rollback(() => {
                      console.log('쿼리 실행 중 에러 발생:', error);
                      result(error, null);
                    });
                    return;
                  }
                  conn.query(`UPDATE managers_info
                  SET manager_grade = ?, manager_name = ?, manager_tel = ?, manager_email = ?
                  WHERE managers_info_id = ?`, [user.manager_grade, user.manager_name, user.manager_tel, user.manager_email, user.managers_info_id], (error, results, fields) => {
                    if (error) {
                      conn.rollback(() => {
                        console.log('쿼리 실행 중 에러 발생:', error);
                        result(error, null);
                      });
                      return;
                    }
                    // 커밋
                    conn.commit((err) => {
                      if (err) {
                        conn.rollback(() => {
                          console.log('트랜잭션 커밋 중 에러 발생:', err);
                          result(err, null);
                        });
                        return;
                      }
                      console.log('트랜잭션 커밋 완료');
                      result(null, 'Success');
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }


  // 고객 삭제(단일, 여러 고객 삭제 가능)
  static removeUser(users: string[], result: (error: any, response: any) => void) {
    const query = `DELETE FROM users WHERE users_id IN (?)`;

    connection.query(query, [users], (err, res) => {
      if (err) {
        console.log(`쿼리 실행 중 에러 발생 (users 테이블): `, err);
        result(err, null);
        connection.releaseConnection;
      } else {
        console.log(`users 및 관련 테이블에서 성공적으로 삭제 완료: `, res);
        result(null, res);
        connection.releaseConnection;
      }
    })
  }






  /*------------------------------코드-----------------------------*/

  // user 코드 조회
  static getAllCode(result: (arg0: QueryError | null, arg1: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => void) {
    connection.query('SELECT * FROM users_code', (err: QueryError | null, res: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }
      console.log("생성된 모든 코드들: ", res);
      result(null, res);
      connection.releaseConnection;
    });
  }
  // 코드 생성
  static generateCode(code: any, result: (err: QueryError | null, result: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => any) {
    connection.query('INSERT INTO users_code SET ?', code, (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][]) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }
      console.log("생성된 코드: ", code);
      result(null, res[0]);
      connection.releaseConnection;
    });
  }
  //코드 검사
  static checkCode(code: any, result: (err: QueryError | Error | null, result: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => any) {
    connection.query('SELECT user_code FROM users_code WHERE user_code = ?', code, (err: QueryError | null, res: any) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }
      else {
        if (res.length > 0) {
          console.log("확인된 코드: ", res[0].user_code); // Fix: Log the specific user_code from the result.
          result(null, res[0]);
        }
        else {
          console.log("일치하는 코드가 없습니다.");
          result(null, null);
        }
        connection.releaseConnection;
      }
    });
  }
  //코드 삭제
  static removeCode(code: any, result: (arg0: QueryError | null, arg1: any) => void) {
    connection.query('DELETE FROM users_code WHERE user_code = ?', code, (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }
      console.log("해당 코드가 정상적으로 삭제되었습니다: ", code);
      result(null, res);
      connection.releaseConnection;
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
          connection.releaseConnection;
          return;
        }
        if (res.length == 0) {
          // id 결과가 없을 시 
          result({ kind: "not_found" }, null);
          connection.releaseConnection;
          return;
        }
        console.log("회원을 찾았습니다: ", { id: id, ...user });
        result(null, { id: id, ...user });
        connection.releaseConnection;
      });
  }
  // user id로 삭제
  static remove(id: any, result: (arg0: QueryError | { kind: string; } | null, arg1: any) => void) {
    connection.query('DELETE FROM users WHERE id = ?', id, (err: QueryError | { kind: string; } | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }
      if (res.length == 0) {
        // id 결과가 없을 시 
        result({ kind: "not_found" }, null);
        connection.releaseConnection;
        return;
      }
      console.log("해당 ID의 회원이 정상적으로 삭제되었습니다: ", id);
      result(null, res);
      connection.releaseConnection;
    });
  }
  // user 전체 삭제
  static removeAll(result: (arg0: { kind: string; } | null, arg1: any) => void) {
    connection.query('DELETE FROM users', (err: any, res: { affectedRows: number; }) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        connection.releaseConnection;
        return;
      }
      console.log(`${res.affectedRows} 명의 회원을 삭제하였습니다.`);
      result(null, res);
      connection.releaseConnection;
    });
  }
  /*-------------------------------------------------------------*/
}

export = User;