import mysql, {Connection} from 'mysql2'
import config from './config/database'

const connection : Connection = mysql.createConnection(config);
connection.connect((err) => {
    if (err) {
        console.error(err)
        console.error("데이터베이스 커넥션 error")
        return
    }
    console.log("데이터베이스 커넥팅 완료!")
})
const getConnection = () : Connection => connection;
const closeConnection = (): void => {
    connection.end((err) => {
        if (err) {
            return console.error("데이터베이스 커넥션 close error")
        }
        console.log("데이터베이스 커넥션 close")
    })
}
export default {
    getConnection,
    closeConnection
}