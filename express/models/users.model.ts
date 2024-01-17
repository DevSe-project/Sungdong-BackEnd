import { QueryError, OkPacket, RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();

// 생성자 

class User {
    userType_id: number;
    userId: any;
    userPassword: any;

    constructor(user: { userType_id: number; userId: any; userPassword: any; }) {
        this.userType_id = user.userType_id;

        this.userId = user.userId;

        this.userPassword = user.userPassword;

    }
    // user 튜플 추가 
    static create(newUser: any, result: (arg0: any, arg1: any) => void) {
        connection.query("INSERT INTO users SET ?", newUser, (err: QueryError | null, res: OkPacket) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            }
            console.log("새 회원이 생성되었습니다: ", { id: res.insertId, ...newUser });
            result(null, { id: res.insertId, ...newUser });
        });
    }
    
    static typeCreate(userType: any, result: (arg0: QueryError | null, arg1: null) => void) {
        connection.query("INSERT INTO users_type SET ?", userType, (err: QueryError | null) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            }
            console.log("새 회원이 생성되었습니다: ", { ...userType });
            result(null, { ...userType });
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
    // user 전체 조회
    static getAll(result: (arg0: null, arg1: null) => void) {
        connection.query('SELECT * FROM users', (err: null, res: null) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            }
            console.log("가입된 모든 회원들: ", res);
            result(null, res);
        });
    }
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
    // user 생성 UserID로 조회
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
    /* -=-=-=-= 로그인 =-=-=-=- */
    static login(user: { userId: any; userPassword: any; }, result: (arg0: QueryError | {kind: string;}| null, arg1: any) => void) {
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
}

export = User;