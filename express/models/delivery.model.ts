// 모델: 데이터와 데이터의 동작을 정의(데이터베이스와의 상호작용을 하는 곳)
import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../db";

const connection = db.getConnection();

class Delivery {
    static getAllDeliveries(result: (arg0: QueryError | null, arg1: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => void) {
        const query = `
        SELECT 
        d.order_id,
        d.delivery_state,
        d.delivery_selectedCor,
        d.delivery_num,
        DATE_FORMAT(o.order_date, '%Y-%m-%d') as order_date,
        op.product_id,
        p.product_image_mini,
        p.product_title,
        op.optionSelected,
        o.order_payAmount
        FROM 
            delivery d
        JOIN 
            \`order\` o ON d.order_id = o.order_id
        JOIN 
            order_product op ON o.order_id = op.order_id
        JOIN 
            product p ON op.product_id = p.product_id
        `;
        connection.query(query, (err: QueryError, res: RowDataPacket | ResultSetHeader) => {
            if (err) {
                console.log("에러 발생: ", err);
                result(err, null);
                return;
            } else {
                if (res) {
                    console.log("찾은 유저: ", res);
                    result(null, res); // 찾은 사용자 정보 반환
                } else {
                    // 결과가 없을 시
                    result(null, null);
                }
            }
        });
    }
}


export default Delivery;
