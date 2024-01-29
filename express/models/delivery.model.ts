import db from "../db";

class Delivery {
    // 배송리스트 조회(전체) : JOIN(order | product | delivery)
    static async getAllDeliveries() {
        try {
            const connection = await db.getConnection();
            const rows = await connection.execute(`
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
            `);
            connection.releaseConnection;
            return rows; // 이 부분에서 rows[0]을 반환하도록 수정
        } catch (error: any) {
            throw new Error(`Failed to get all deliveries: ${error.message}`);
        }
    }

    // Update[Delivery State] - delivery_state 
    static async updateDeliveryState(orderId: number, newState: number) {
        try {
            const connection = await db.getConnection();
            const rows = await connection.execute(
                'UPDATE delivery SET delivery_state = ? WHERE order_id = ?',
                [newState, orderId]
            );
            connection.releaseConnection;
            return rows;
        } catch (error: any) {
            throw new Error(`Failed to update delivery state: ${error.message}`);
        }
    }

    // Update[Delivery Invoice] - delivery_selectedCor, delivery_num 
    static async updateDeliveryInvoice(orderId: number, newSelectedCor: string, newNum: string) {
        try {
            const connection = await db.getConnection();
            const rows = await connection.execute(
                'UPDATE delivery SET delivery_selectedCor = ?, delivery_num = ? WHERE order_id = ?',
                [newSelectedCor, newNum, orderId]
            );
            connection.releaseConnection;
            return rows;
        } catch (error: any) {
            throw new Error(`Failed to update delivery state: ${error.message}`);
        }
    }
}

export default Delivery;
