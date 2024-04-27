import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, ProcedureCallPacket, PoolConnection, OkPacket } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class User {

  /* --------------------------로그인/회원가입/로그아웃-------------------------- */
  /** user 튜플 추가 - 회원가입
   * 
   * @param newUser 
   * @param result 
   */
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

  /** user 생성 시 UserID 중복검사
   * 
   * @param userID 
   * @param result 
   */
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

  /** userID 찾기
   * 
   * @param user 
   * @param result 
   */
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

  /** userPW 찾기
   * 
   * @param user 
   * @param result 
   */
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

  /* --------------------------마이페이지-------------------------- */
  /**
   * 
   * @param newPassword 
   *  * prevPW: now_password 이전 비밀번호
   *  * newPW: re_password 새 비밀번호
   *  * newPWConfirm: confirm_re_password 새 비밀번호 확인
   * @param result 
   */
  static modifyPassword(newPassword: any, users_id: string, result: (arg0: QueryError | string | null, arg1: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => void) {
    // 업데이트 쿼리
    const updateQuery = `
      UPDATE users SET userPassword = ?
      WHERE users_id = ?
    `
    // 쿼리 파라미터
    const queryParams = [
      newPassword.newPWConfirm,
      users_id
    ];

    // 디버깅: 실행쿼리 확인
    const mysql = require('mysql');
    const fullQuery = mysql.format(updateQuery, queryParams);
    console.log(`
      [ 실행쿼리 ] 
      ${fullQuery}
    `);

    // 업데이트 쿼리 실행
    connection.query(updateQuery, queryParams, (err, res) => {
      if (err) {
        console.log(`비밀번호 수정 중 에러 발생: ${JSON.stringify(err)}`);

        result(err, null);
        connection.releaseConnection;
      } else {
        console.log(`비밀번호 변경 완료: ${JSON.stringify(res)}`);

        result(null, err);
        connection.releaseConnection;
      }

    })
  }

  /* --------------------------WelcomeModule-------------------------- */

  /** Welcome Module에 필요한 user(users_corName), order(orderState)정보 조회
   * 
   * @param user 
   * @param result 
   */
  static welcomeModuleInfo(user: any, result: (arg0: QueryError | string | null, arg1: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => void) {
    connection.query(`
      SELECT 
        u.users_id AS users_id,
        u.userType_id AS userType_id,
        uc.cor_corName AS cor_corName, 
        SUM(CASE WHEN o.orderState IN(0,1) THEN 1 ELSE 0 END) AS ordersCount,
        SUM(CASE WHEN o.orderState IN(3) THEN 1 ELSE 0 END) AS preparing_orders,
        SUM(CASE WHEN o.orderState IN(4) THEN 1 ELSE 0 END) AS shipping_orders,
        SUM(CASE WHEN o.orderState IN(5) THEN 1 ELSE 0 END) AS completed_orders
      FROM 
        users u 
      JOIN 
        users_corInfo uc ON u.users_id = uc.users_id 
      LEFT JOIN 
        \`order\` o ON u.users_id = o.users_id 
      WHERE u.users_id = ?
      GROUP BY 
        u.users_id, uc.cor_corName
      `, [user.users_id], (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][]) => {
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

  /** 로그인
   * 
   * @param user 
   * @param result 
   */
  static login(user: { userId: any; userPassword: any; }, result: (arg0: QueryError | Error | null, arg1: any) => void) {
    connection.query('SELECT * FROM users WHERE userId = ?  AND userPassword = ?', [user.userId, user.userPassword], (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][], fields: FieldPacket[]) => {
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

  /** user 생성 id로 조회
   * 
   * @param userID 
   * @param result 
   */
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
  /** 모든 유저 조회
   * 
   * @param result 
   */
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

  /** 페이지와 포스팅 개수에 따른 user 조회
   * 
   * @param currentPage 
   * @param itemsPerPage 
   * @param result 
   */
  static readUser(readType: String, currentPage: number, itemsPerPage: number, result: (error: any, data: any) => void) {

    console.log(`요청 유형: ${readType}`);

    const select = `SELECT *, ui.name, IFNULL(m.name,"미배정") as managerName `
    const joinTable = `FROM users u
                      JOIN users_info ui 
                        ON u.users_id = ui.users_id
                      LEFT OUTER JOIN managers m 
                        ON ui.managers_id = m.managers_id
                      JOIN users_address ua 
                        ON ui.users_id = ua.users_id
                      JOIN users_corInfo uc 
                        ON ua.users_id = uc.users_id`
    const fixedCondition = `WHERE m.name ${readType === "done" ? `IS NOT NULL` : `IS NULL`}`;
    const orderByQuery = `ORDER BY u.userType_id DESC, uc.cor_corName ASC`;
    const limitQuery = `LIMIT ?, ?`;

    // 쿼리모듈 결합
    const combinedQuery = `
    ${select}
    ${joinTable}
    ${fixedCondition}
    ${orderByQuery}
    ${limitQuery}
    `
    // 파리미터 결합
    const offset = (currentPage - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const params = [offset, limit]

    const mysql = require('mysql');
    const fullQuery = mysql.format(combinedQuery, params);
    console.log(fullQuery);

    const countQuery = `
        SELECT 
          COUNT(*) as totalRows 
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
      connection.query(fullQuery, (err: QueryError | null, res: RowDataPacket[]) => {
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

  /** 특정 user 조회 - 필터링
   * 
   * @param newFilter 
   * @param currentPage 
   * @param itemsPerPage 
   * @param result 
   */
  static filteredUser(readType: string, newFilter: any, currentPage: number, itemsPerPage: number, result: (error: any, data: any) => void) {
    const offset = (currentPage - 1) * itemsPerPage;
    const limit = itemsPerPage;
    /**
    * * SQL 쿼리의 WHERE 절에 사용할 조건을 생성
    * * 조건과 값에 기반하여 조건 문자열을 생성
    * * 값이 참인 경우 'AND'로 시작하는 조건 문자열을 반환
    * * 그렇지 않으면 빈 문자열을 반환
    * @param condition WHERE 절에 사용될 조건 문자열
    * @param value 값의 참/거짓 여부를 확인하기 위한 값
    * @returns WHERE 절 조건을 나타내는 문자열
    */
    const generateWhereCondition = (condition: string, value: any) => {
      return value ? `AND ${condition} LIKE '%${value}%'` : '';
    };
    /**
     * SQL 쿼리에서 사용할 매개변수를 생성
     * 값에 기반하여 매개변수 문자열을 생성
     * 값이 참인 경우 LIKE 절에서 패턴 매칭을 위해 '%'로 감싼 값을 반환
     * 그렇지 않으면 null을 반환
     * @param value 매개변수로 사용될 값
     * @returns SQL 쿼리에서 사용될 매개변수를 나타내는 문자열
     */
    const generateQueryParam = (value: any) => {
      return value ? `%${value}%` : null;
    };


    const selectQuery = `
      SELECT *, ui.name, IFNULL(m.name,"미배정") as managerName
      FROM users u
      JOIN users_info ui ON u.users_id = ui.users_id
      LEFT OUTER JOIN managers m ON ui.managers_id = m.managers_id
      JOIN users_address ua ON ui.users_id = ua.users_id
      JOIN users_corInfo uc ON ua.users_id = uc.users_id
      WHERE m.name ${readType === "done" ? `IS NOT NULL` : `IS NULL`}
      ${generateWhereCondition('uc.cor_corName', newFilter.cor_corName)}
      ${generateWhereCondition('uc.cor_ceoName', newFilter.cor_ceoName)}
      ${generateWhereCondition('uc.cor_num', newFilter.cor_num)}
      ${generateWhereCondition('u.userType_id', newFilter.userType_id !== -1)}
      ${generateWhereCondition('(SELECT ui.name FROM managers AS m WHERE m.managers_id = ui.managers_id)', newFilter.managerName)}
      ORDER BY u.userType_id DESC, uc.cor_corName ASC
      LIMIT ${offset}, ${limit}
    `;

    const countQuery = `
      SELECT COUNT(*) AS totalRows
      FROM users u
      JOIN users_info ui ON u.users_id = ui.users_id
      LEFT OUTER JOIN managers m ON ui.managers_id = m.managers_id
      JOIN users_address ua ON ui.users_id = ua.users_id
      JOIN users_corInfo uc ON ua.users_id = uc.users_id
      WHERE m.name ${readType === "done" ? `IS NOT NULL` : `IS NULL`}
      ${generateWhereCondition('uc.cor_corName', newFilter.cor_corName)}
      ${generateWhereCondition('uc.cor_ceoName', newFilter.cor_ceoName)}
      ${generateWhereCondition('uc.cor_num', newFilter.cor_num)}
      ${generateWhereCondition('u.userType_id', newFilter.userType_id !== -1)}
      ${generateWhereCondition('(SELECT ui.name FROM managers AS m WHERE m.managers_id = ui.managers_id)', newFilter.managerName)}
    `;

    const queryParams = [
      generateQueryParam(newFilter.cor_corName),
      generateQueryParam(newFilter.cor_ceoName),
      generateQueryParam(newFilter.cor_num),
      newFilter.userType_id !== -1 ? newFilter.userType_id : null,
      generateQueryParam(newFilter.managerName)
    ];

    console.log(`[[Step_2: 전송받은 데이터]]\n${newFilter.managerName}`);
    const mysql = require('mysql');
    const queryDebuggig = mysql.format(selectQuery, queryParams);
    console.log(`[[Full Query]]\n${queryDebuggig}`); // 전체 쿼리 출력

    connection.query(countQuery, queryParams, (err, countResult: any) => {
      if (err) {
        result(err, null);
        return;
      }
      const totalRows = countResult[0].totalRows;
      connection.query(selectQuery, (err: QueryError | null, res: RowDataPacket[]) => {
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


  /** 유저 정렬
   * 
   * @param user 
   * @param result 
   * @returns 
   */
  static sortedUser(readType: String, sort: any, currentPage: number, itemsPerPage: number, result: (error: any, data: any) => void) {
    const offset = (currentPage - 1) * itemsPerPage;
    const limit = itemsPerPage;

    /**
     * Debugging Code
     * 필터링할 요소들을 확인합니다.
     */
    console.log(`필터링할 요소 ${sort}`);

    // 사용자 입력 값으로부터 컬럼 및 정렬 방식을 동적으로 생성
    const orderByColumns = [sort.first, sort.second, sort.third].filter(Boolean); // 비어있는 값 제거
    /**
     * filter(Boolean) : 각 요소를 Boolean 타입으로 변환하고, true로 평가되는 요소들만 필터링
     */

    /**
     * true인 값들만 필터링된 배열이 비었다면, 전달받은 sort 요소가 없다는 것이므로,
     * 정렬할 컬럼이 지정되지 않았다는 에러 메세지를 반환하고,
     * 연결을 끊습니다.
     */
    if (orderByColumns.length === 0) {
      // 정렬할 컬럼이 없으면 에러 처리
      const noOrderByError = new Error("정렬할 컬럼이 지정되지 않았습니다.");
      console.error(noOrderByError.message);
      result(noOrderByError, null);
      connection.releaseConnection;
      return;
    }

    const orderByClause = orderByColumns.map(column => `${column} ASC`).join(', ');

    const selectQuery = `
      SELECT *, ui.name, IFNULL(m.name,"미배정") as managerName
      FROM users u
      JOIN users_info ui ON u.users_id = ui.users_id
      LEFT OUTER JOIN managers m ON ui.managers_id = m.managers_id
      JOIN users_address ua ON ui.users_id = ua.users_id
      JOIN users_corInfo uc ON ua.users_id = uc.users_id
      WHERE m.name ${readType === "done" ? `IS NOT NULL` : `IS NULL`}
      ORDER BY ${orderByClause}
      LIMIT ${offset}, ${limit}
    `

    const countQuery = `
      SELECT COUNT(*) AS totalRows
      FROM users u
      JOIN users_info ui ON u.users_id = ui.users_id
      LEFT OUTER JOIN managers m ON ui.managers_id = m.managers_id
      JOIN users_address ua ON ui.users_id = ua.users_id
      JOIN users_corInfo uc ON ua.users_id = uc.users_id
      WHERE m.name ${readType === "done" ? `IS NOT NULL` : `IS NULL`}
    `

    console.log(`[전송받은 데이터]\n ${sort}`);
    const mysql = require('mysql');
    const fullQuery = mysql.format(selectQuery, orderByClause);
    console.log(fullQuery);

    connection.query(countQuery, (err, countResult: any) => {
      if (err) {
        result(err, null);
        return;
      }
      const totalRows = countResult[0].totalRows;
      connection.query(selectQuery, (err: QueryError | Error | null, res: RowDataPacket[]) => {
        if (err) {
          console.error("에러 발생: ", err);
          result(err, null);
          connection.releaseConnection;
          return;
        } else {

          if (res.length === 0) {
            const noMatchingUserError = new Error("조건에 일치하는 유저가 없습니다.");
            console.error(noMatchingUserError.message);
            result(noMatchingUserError, null);
            connection.releaseConnection;
            return;
          }

          const totalPages = Math.ceil(totalRows / itemsPerPage);
          const responseData = {
            data: res,
            currentPage: currentPage,
            totalPages: totalPages,
          }
          // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
          console.log("고객정보가 갱신되었습니다: ", responseData);
          result(null, responseData);
          connection.releaseConnection
        }
      });
    });
  }

  /** 일괄/단일 고객정보 업데이트
   * 
   * @param users 
   * @param result 
   */
  static updateUser(users: any, result: (error: any, response: any) => void) {
    // 풀에서 연결을 가져옴
    connection.getConnection((err, conn) => {
      if (err) {
        console.log('연결 가져오기 중 에러 발생:', err);
        result(err, null);
        return;
      }
      // ----------연결에서 트랜잭션 시작---------- //
      conn.beginTransaction((err) => {
        if (err) {
          console.log('트랜잭션 시작 중 에러 발생:', err);
          result(err, null);
          return;
        }

        // ---------업데이트 시작--------- //
        if (Array.isArray(users)) {
          // 여러 사용자의 정보를 받아서 일괄 처리
          for (const user of users) {
            updateSingleUser(conn, user, () => { });
          }
        } else {
          // 단일 사용자 정보를 받아서 업데이트
          updateSingleUser(conn, users, () => { });
        }
        // ---------업데이트 종료--------- //

        // ---------커밋 시작--------- //
        conn.commit((err) => {
          if (err) {
            conn.rollback(() => {
              console.log('트랜잭션 커밋 중 에러 발생: ', err);
              result(err, null);
            });
            return;
          }
          console.log('트랜잭션 커밋 완료');
          result(null, 'Success');
        })
        // ---------커밋 종료--------- //
      });
      // ----------트랜잭션 종료---------- //
    });

    /** 단일 고객 정보 업데이트
     * 
     * @param conn 
     * @param user 
     */
    function updateSingleUser(conn: any, user: any, callback: () => void): void {
      const mysql = require('mysql');

      // 고객 정보 업데이트 쿼리문
      const queries = [
        {
          query: `UPDATE users_address SET zonecode = ?, roadAddress = ?, bname = ?, buildingName = ?, jibunAddress = ?, addressDetail = ? WHERE address_id = ?`,
          params: [user.zonecode, user.roadAddress, user.bname, user.buildingName, user.jibunAddress, user.addressDetail, user.address_id],
          errorMsg: '고객 주소 정보 업데이트'
        },
        {
          query: `UPDATE users_info SET email = ?, emailService = ?, name = ?, tel = ?, smsService = ?, hasCMS = ?, isBanned = ?, managers_id = ? WHERE users_info_id = ?`,
          params: [user.email, user.emailService, user.name, user.tel, user.smsService, user.hasCMS, user.isBanned, null, user.users_info_id], // managers_id는 나중에 채워질 것임
          errorMsg: '고객 정보 업데이트'
        },
        {
          query: `UPDATE users_corInfo SET cor_ceoName = ?, cor_corName = ?, cor_sector = ?, cor_category = ?, cor_num = ?, cor_fax = ?, cor_tel = ? WHERE users_id = ?`,
          params: [user.cor_ceoName, user.cor_corName, user.cor_sector, user.cor_category, user.cor_num, user.cor_fax, user.cor_tel, user.users_id],
          errorMsg: '회사정보 업데이트'
        },
        {
          query: `UPDATE users SET userType_id = ?, userId = ?, userPassword = ? WHERE users_id = ?`,
          params: [user.userType_id, user.userId, user.userPassword, user.users_id],
          errorMsg: '고객 메인 정보 업데이트'
        }
      ];

      // 담당자 고유번호 조회 쿼리
      const findManagersId = `SELECT managers_id FROM managers WHERE name = ${mysql.escape(user.managerName)}`;

      // 담당자 고유번호 조회
      conn.query(findManagersId, (error: any, results: any) => {
        if (error) {
          conn.rollback(() => {
            console.error('담당자 고유번호 조회 중 에러 발생:', error);
            result(error, null);
          });
          return;
        }

        // 담당자 고유번호를 해당 params에 추가/삭제
        if (results && results.length > 0) {
          const managersId = results[0].managers_id;
          queries[1].params[7] = managersId;
        } else {
          queries[1].params[7] = null;
        }

        // 각 쿼리 실행
        queries.forEach((queryObj, index) => {
          conn.query(queryObj.query, queryObj.params, (error: any) => {
            if (error) {
              conn.rollback(() => {
                console.error(`${queryObj.errorMsg} 중 에러 발생:`, error);
                result(error, null);
              });
              return;
            }
            
            // 사용자의 userType_id가 100이라면 insertManager 함수 호출
            if (user.userType_id === 100) {
              insertManager(conn, user, () => { });
              // 마지막 쿼리까지 모두 성공적으로 실행되면 콜백 호출
              if (index === queries.length - 1) {
                callback(); // 콜백함수 호출
              }
            }
          });
        });

      });
    }

    /**
     * 
     * @param conn 
     * @param user 
     * @param callback 
     */
    function insertManager(conn: any, user: any, callback: () => void): void {
      // 새로운 매니저 정보를 삽입할 때 사용할 데이터
      const { userType_id, users_id, name } = user;

      const query = `INSERT INTO managers (userType_id, users_id, name) VALUES (?, ?, ?)`

      // 데이터베이스 연결을 통해 쿼리 실행
      conn.query(query, [userType_id, users_id, name], (err: any, result: any) => {
        if (err) {
          // 에러 처리
          console.error("Error inserting manager:", err);
          // 에러 발생 시 콜백 호출
          callback();
        } else {
          // 쿼리 성공 시 콜백 호출
          callback();
        }
      });
    }
  }

  /** 고객 삭제(단일/일괄 삭제)
   * 
   * @param users 
   * @param result 
   */
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

  /** user 코드 조회 
   * 
   * @param result 
   */
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


  /** 코드 생성
   * 
   * @param code 
   * @param result 
   */
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

  /** 코드 검사
   * 
   * @param code 
   * @param result 
   */
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

  /** 코드 삭제
   * 
   * @param code 
   * @param result 
   */
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
}

export = User;