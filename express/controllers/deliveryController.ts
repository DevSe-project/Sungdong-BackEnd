// 컨트롤러: 사용자의 입력을 처리하고 적절한 뷰를 렌더링하거나 업데이트
import { Request, Response } from "express";
import Delivery from "../models/delivery.model";

const deliveryController = {
  // 모든 배송 데이터 조회
  deliveryAll: async (req: Request, res: Response) => {
    try {
      const results = await Delivery.getAllDeliveries();
      return res.status(200).json(results);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "배송 데이터 조회 중 오류가 발생했습니다." });
    }
  },

  // 배송상태 변경사항 적용
  applyEditedState: async (req: Request, res: Response) => {
    try {
      // 요청에서 변경된 배송 상태 데이터 추출
      const fetchedData = req.body;

      // 유효성 검사: 변경된 배송 상태 데이터가 유효한지 확인
      if (!Array.isArray(fetchedData)) {
        return res.status(400).json({ message: "잘못된 데이터 형식입니다." });
      }

      // 데이터 처리: 변경된 배송 상태 데이터를 데이터베이스에 업데이트
      await Promise.all(fetchedData.map(async (item: { order_id: number, delivery_state: number }) => {
        await Delivery.updateDeliveryState(item.order_id, item.delivery_state);
      }));

      // 응답 전송: 업데이트 성공
      return res.status(200).json({ message: "배송 상태가 성공적으로 업데이트되었습니다." });
    } catch (error) {
      // 응답 전송: 업데이트 실패
      console.error("배송 상태 업데이트 중 오류가 발생했습니다:", error);
      return res.status(500).json({ message: "배송 상태 업데이트 중 오류가 발생했습니다.ㅅㅂ" });
    }
  },

  // 송장수정 변경사항 적용
  applyEditedInvoice: async (req: Request, res: Response) => {
    try {
      // 요청에서 변경된 배송 상태 데이터 추출
      const  fetchedData  = req.body;

      // 유효성 검사: 변경된 배송 상태 데이터가 유효한지 확인
      if (!Array.isArray(fetchedData)) {
        return res.status(400).json({ message: "잘못된 데이터 형식입니다." });
      }

      // 데이터 처리: 변경된 배송 상태 데이터를 데이터베이스에 업데이트
      await Promise.all(fetchedData.map(async (item: { order_id: number, delivery_selectedCor: string, delivery_num : string }) => {
        await Delivery.updateDeliveryInvoice(item.order_id, item.delivery_selectedCor, item.delivery_num);
      }));

      // 응답 전송: 업데이트 성공
      return res.status(200).json({ message: "배송 상태가 성공적으로 업데이트되었습니다." });
    } catch (error) {
      // 응답 전송: 업데이트 실패
      console.error("배송 상태 업데이트 중 오류가 발생했습니다:", error);
      return res.status(500).json({ message: "배송 상태 업데이트 중 오류가 발생했습니다.ㅅㅂ" });
    }
  }
};

export default deliveryController;
