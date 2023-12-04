import mysql from 'mysql'
import config from './config/database'

const connection = mysql.createConnection(config);
connection.connect((err) => {
    if (err) {
        console.error(err)
        console.error("데이터베이스 커넥션 error")
        return
    }
    console.log("데이터베이스 커넥팅 완료!")
})
const getConnection = () => connection
const closeConnection = () => {
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