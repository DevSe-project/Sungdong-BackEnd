import mysql, { Connection } from 'mysql2'
import config from './config/database'
import { Pool } from 'mysql2/typings/mysql/lib/Pool';
import { PoolConnection } from 'mysql2/typings/mysql/lib/PoolConnection';

const connection: Pool = mysql.createPool(config);
connection.getConnection((err, connection: PoolConnection) => {
  if (err) {
    console.error(err)
    console.error("데이터베이스 커넥션 error")
    return
  }
  console.log("데이터베이스 커넥팅 완료!");
  connection.release();
})
const getConnection = (): Pool => connection;
const closeConnection = (): void => {
  connection.end((err: any) => {
    if (err) {
      return console.error("데이터베이스 커넥션 close error")
    }
    console.log("데이터베이스 커넥션 close")
  })
}

// 풀에서 개별 연결을 가져와서 트랜잭션을 수행하는 함수
const performTransaction = (callback: (connection: PoolConnection) => void) => {
  connection.getConnection((getConnectionError, connection: PoolConnection) => {
    if (getConnectionError) {
      console.error('연결을 가져오는 중 에러 발생:', getConnectionError);
      return;
    }

    // 트랜잭션 시작
    connection.beginTransaction((beginTransactionError) => {
      if (beginTransactionError) {
        console.error('트랜잭션 시작 중 에러 발생:', beginTransactionError);
        connection.release();
        return;
      }

      // 콜백 함수에 연결을 전달하여 트랜잭션 작업 수행
      callback(connection);
    });
  });
};

export default {
  getConnection,
  closeConnection,
  performTransaction
}