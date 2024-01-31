import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../db";



class Delivery {

    static connection = db.getConnection();

    // 배송리스트 조회(전체) : JOIN(order | product | delivery)
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
                p.product_price,
                ROUND((p.product_price * (1 - (p.product_discount * 0.01)))) as discountPrice
            FROM 
                delivery d
            JOIN 
                \`order\` o ON d.order_id = o.order_id
            JOIN 
                order_product op ON o.order_id = op.order_id
            JOIN 
                product p ON op.product_id = p.product_id
        `;
        this.connection.query(query, (err: QueryError, res: RowDataPacket | ResultSetHeader) => {
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



    // Update[Delivery State] - delivery_state 
    static async updateDeliveryState(orderId: number, newState: number) {
        try {
            const rows = await this.connection.execute(
                'UPDATE delivery SET delivery_state = ? WHERE order_id = ?',
                [newState, orderId]
            );
            this.connection.releaseConnection;
            return rows;
        } catch (error: any) {
            throw new Error(`Failed to update delivery state: ${error.message}`);
        }
    }

    // Update[Delivery Invoice] - delivery_selectedCor, delivery_num 
    static async updateDeliveryInvoice(orderId: number, newSelectedCor: string, newNum: string) {
        try {
            const rows = await this.connection.execute(
                'UPDATE delivery SET delivery_selectedCor = ?, delivery_num = ? WHERE order_id = ?',
                [newSelectedCor, newNum, orderId]
            );
            this.connection.releaseConnection;
            return rows;
        } catch (error: any) {
            throw new Error(`Failed to update delivery state: ${error.message}`);
        }
    }

    // Remove [Delivery InquireTable] - order_id
    // static async deleteDeliveryData(order_id: string) {
    //     try {
    //         const rows = await this.connection.execute(
    //             'DELETE FROM delivery WHERE order_id = ?',
    //             [order_id]
    //         );
    //         this.connection.releaseConnection;
    //         return rows;
    //     } catch (error: any) {
    //         throw new Error(`삭제에 실패하였습니다. 사유: ${error.message}`);
    //     }
    // }
    static deleteByIds(orderIds: number[], result: (error: any, response: any) => void) {
        const query = "DELETE FROM delivery WHERE order_id IN (?)"
        console.log(query)
        console.log(orderIds)
        this.connection.query(query, [orderIds], (err, res) => {
            if (err) {
                console.log(`쿼리 실행 중 에러 발생: `, err);
                result(err, null);
                this.connection.releaseConnection;
            } else {
                console.log('성공적으로 삭제 완료: ', res);
                result(null, res);
                this.connection.releaseConnection;
            }
        })
    }
}

export default Delivery;
