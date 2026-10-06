import type { Metadata } from 'next';
import ContactForm from './ContactForm';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Liên hệ tư vấn | AI Sales Agent',
  description: 'Gửi yêu cầu tư vấn hoặc báo giá. Yêu cầu được ghi nhận và phân loại tự động.',
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <section className={styles.intro}>
          <h1>Cho chúng tôi biết bạn đang cần gì</h1>
          <p className={styles.lead}>
            Báo giá, dùng thử, hỗ trợ kỹ thuật hay đề xuất hợp tác: chỉ cần mô tả ngắn gọn và để lại cách liên hệ.
          </p>
          <ol className={styles.steps}>
            <li>
              <strong>Yêu cầu được ghi nhận</strong>
              Bạn nhận một mã tham chiếu ngay sau khi gửi.
            </li>
            <li>
              <strong>Hệ thống phân loại</strong>
              Báo giá, hỗ trợ hay hợp tác được nhận diện tự động để chuyển đúng người.
            </li>
            <li>
              <strong>Đội ngũ liên hệ lại</strong>
              Qua email hoặc số điện thoại bạn để lại.
            </li>
          </ol>
        </section>
        <ContactForm />
      </main>
    </div>
  );
}
