import { Request, Response } from "express";
import Delivery from "../models/delivery.model";

const deliveryController = {
  // 모든 배송 데이터 조회
  deliveryAll: (req: Request, res: Response) => {
    Delivery.getAllDeliveries((error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: error });
      }
      return res.status(200).json(results);
    });
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
      const fetchedData = req.body;

      // 유효성 검사: 변경된 배송 상태 데이터가 유효한지 확인
      if (!Array.isArray(fetchedData)) {
        return res.status(400).json({ message: "잘못된 데이터 형식입니다." });
      }

      // 데이터 처리: 변경된 배송 상태 데이터를 데이터베이스에 업데이트
      await Promise.all(fetchedData.map(async (item: { order_id: number, delivery_selectedCor: string, delivery_num: string }) => {
        await Delivery.updateDeliveryInvoice(item.order_id, item.delivery_selectedCor, item.delivery_num);
      }));

      // 응답 전송: 업데이트 성공
      return res.status(200).json({ message: "배송 상태가 성공적으로 업데이트되었습니다." });
    } catch (error) {
      // 응답 전송: 업데이트 실패
      console.error("배송 상태 업데이트 중 오류가 발생했습니다:", error);
      return res.status(500).json({ message: "배송 상태 업데이트 중 오류가 발생했습니다.ㅅㅂ" });
    }
  },

  // 배송 취소
  // deleteData: async (req: Request, res: Response) => {
  //   try {
  //     const fetchedData = req.body; // 클라이언트로부터 받은 order_id 배열

  //     // 유효성 검사: 변경된 배송 상태 데이터가 유효한지 확인
  //     if (!Array.isArray(fetchedData)) {
  //       return res.status(400).json({ message: "잘못된 데이터 형식입니다." });
  //     }

  //     // 배송 데이터 삭제: 받은 order_ids 배열의 각 order_id에 대해 반복적으로 삭제 작업 수행
  //     await Promise.all(fetchedData.map(async (item: {order_id: string}) => {
  //       const rows = await Delivery.deleteDeliveryData(item.order_id); // 정적 메서드 호출
  //       // 삭제 결과에 따라 응답 전송
  //       if (rows) {
  //         console.error('해당 주문 ID에 대한 배송 데이터를 찾을 수 없습니다:', item.order_id);
  //       }
  //     }));

  //     // 모든 삭제 작업이 완료된 후에 응답 전송
  //     return res.status(200).json({ message: "배송이 성공적으로 취소되었습니다." });
  //   } catch (error) {
  //     console.error("배송 취소 중 오류가 발생했습니다:", error);
  //     return res.status(500).json({ message: "배송 취소 중 오류가 발생했습니다." });
  //   }
  // }
  delete: async (req: Request, res: Response) => {
    const orderIds = req.params.ids.split(',').map(Number);
    Delivery.deleteByIds(orderIds, (err: { message: any; }) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 상품 삭제가 완료 되었습니다.', success: true });
      }
    })
  }

};

export default deliveryController;
