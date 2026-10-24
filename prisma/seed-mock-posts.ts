import { CategoryLayout, ItemType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fictional demo content. Existing posts are never overwritten.
const categories: { slug: string; name: string; layoutType: CategoryLayout }[] = [
  { slug: 'robotics-iot', name: 'Robotics & IoT', layoutType: 'SHOWCASE_GRID' },
  { slug: 'bai-bao-khoa-hoc', name: 'Nghiên cứu khoa học', layoutType: 'BIBLIOGRAPHY' },

];

const posts: { slug: string; title: string; type: ItemType; category: string; summary: string; detail: string }[] = [
  { slug: 'mock-tro-ly-tra-cuu-hoc-thuat', title: 'Trợ lý tra cứu tài liệu học thuật bằng RAG', type: 'PROJECT', category: 'robotics-iot', summary: 'Xây dựng trợ lý hỏi đáp tiếng Việt giúp sinh viên tìm kiếm nội dung trong bộ tài liệu học tập và kiểm tra nguồn trích dẫn.', detail: 'Hệ thống chia nhỏ tài liệu, lập chỉ mục vector và truy xuất các đoạn liên quan trước khi tạo câu trả lời. Giao diện hiển thị nguồn để người đọc đối chiếu. Hướng phát triển là bổ sung đánh giá chất lượng truy xuất và hỗ trợ tài liệu có bảng biểu.' },
  { slug: 'mock-robot-giao-hang', title: 'Robot giao hàng tự hành trong khuôn viên trường', type: 'PROJECT', category: 'robotics-iot', summary: 'Mô hình robot vận chuyển đồ dùng giữa các phòng thí nghiệm với khả năng lập bản đồ và tránh chướng ngại vật.', detail: 'Thiết kế kết hợp cảm biến khoảng cách, camera và bộ điều khiển chuyển động. Nhóm xây dựng bản đồ hành lang mô phỏng, thiết lập điểm nhận hàng và kiểm tra tình huống có người đi ngang. Phiên bản tiếp theo tập trung vào quản lý năng lượng và dừng khẩn cấp.' },
  { slug: 'mock-quan-trac-khong-khi', title: 'Trạm IoT quan trắc chất lượng không khí lớp học', type: 'PROJECT', category: 'robotics-iot', summary: 'Thiết bị theo dõi nhiệt độ, độ ẩm và nồng độ CO₂, kết hợp dashboard giúp quan sát điều kiện học tập theo thời gian.', detail: 'Các nút cảm biến gửi dữ liệu qua MQTT đến dịch vụ thu thập trung tâm. Dashboard biểu diễn chuỗi thời gian và hỗ trợ ngưỡng cảnh báo do người dùng cấu hình. Nhóm dự kiến bổ sung quy trình hiệu chuẩn và cơ chế lưu tạm khi mất mạng.' },
  { slug: 'mock-nhan-dien-benh-la-cay', title: 'Nhận diện bệnh lá cây với mô hình học sâu gọn nhẹ', type: 'RESEARCH_PAPER', category: 'bai-bao-khoa-hoc', summary: 'Đề xuất quy trình nghiên cứu phân loại ảnh lá cây trên thiết bị có tài nguyên hạn chế, hướng đến hỗ trợ nông nghiệp thông minh.', detail: 'Thiết kế thí nghiệm so sánh mô hình nền với phiên bản lượng tử hóa, theo dõi độ chính xác, độ trễ và dung lượng. Dữ liệu cần được tách theo nguồn chụp để giảm rò rỉ giữa tập huấn luyện và đánh giá. Đây là đề cương minh họa, chưa có kết quả công bố.' },
  { slug: 'mock-phan-tich-cam-xuc', title: 'Phân tích cảm xúc phản hồi học phần bằng tiếng Việt', type: 'RESEARCH_PAPER', category: 'bai-bao-khoa-hoc', summary: 'Nghiên cứu cách phân loại phản hồi học phần theo khía cạnh như nội dung, bài tập và phương pháp giảng dạy.', detail: 'Quy trình dự kiến bao gồm ẩn danh phản hồi, xây dựng hướng dẫn gán nhãn và đánh giá mức độ đồng thuận. Mô hình được so sánh bằng macro F1 và phân tích lỗi với câu phủ định. Không sử dụng dữ liệu cá nhân thật trong nội dung minh họa này.' },
  { slug: 'mock-du-bao-dien-nang', title: 'Dự báo điện năng phòng thí nghiệm bằng chuỗi thời gian', type: 'RESEARCH_PAPER', category: 'bai-bao-khoa-hoc', summary: 'Khảo sát phương pháp dự báo nhu cầu điện để hỗ trợ lập kế hoạch sử dụng thiết bị và tiết kiệm năng lượng.', detail: 'Đề cương so sánh dự báo mùa vụ đơn giản với mô hình học máy sử dụng lịch hoạt động và tín hiệu môi trường. Đánh giá theo cửa sổ thời gian liên tiếp, tránh sử dụng dữ liệu tương lai. Kết quả định lượng sẽ được bổ sung khi có thí nghiệm thực tế.' },
  { slug: 'mock-campus-access', title: 'Campus Access — bản đồ tiện ích tiếp cận trong trường', type: 'PROJECT', category: 'robotics-iot', summary: 'Ứng dụng bản đồ giúp tìm thang máy, lối đi thuận tiện và các tiện ích hỗ trợ tiếp cận trong khuôn viên.', detail: 'Người dùng có thể lọc địa điểm theo tiện ích, xem mô tả đường đi và gửi phản hồi về chướng ngại vật. Thiết kế ưu tiên điều hướng bàn phím, độ tương phản và khả năng đọc trên điện thoại. Dữ liệu địa điểm của bản mẫu hoàn toàn giả lập.' },
  { slug: 'mock-open-data-toolkit', title: 'Open Data Toolkit — công cụ làm sạch dữ liệu mở', type: 'PROJECT', category: 'robotics-iot', summary: 'Bộ công cụ xử lý CSV giúp chuẩn hóa cột dữ liệu, phát hiện bản ghi trùng và tạo báo cáo chất lượng.', detail: 'Các bước xử lý được khai báo bằng cấu hình để dễ tái lập. Báo cáo ghi nhận số dòng lỗi, tỷ lệ thiếu và các phép biến đổi đã áp dụng. Lộ trình mở rộng gồm kiểm tra schema và xuất báo cáo HTML cho nhóm nghiên cứu.' },
  { slug: 'mock-giai-thuong-hackathon', title: 'Giải Nhì Hackathon sinh viên: giải pháp phân loại rác', type: 'RESEARCH_PAPER', category: 'bai-bao-khoa-hoc', summary: 'Câu chuyện minh họa về đội sinh viên phát triển nguyên mẫu hướng dẫn phân loại rác qua nhận diện hình ảnh.', detail: 'Trong kịch bản demo, nhóm phân công công việc thành nhận diện ảnh, giao diện và thuyết trình. Sản phẩm tập trung vào hướng dẫn dễ hiểu và cho phép sửa dự đoán. Tên giải thưởng và thành tích trong bài là giả lập, không đại diện cho kết quả cuộc thi thực tế.' },
  { slug: 'mock-giai-thuong-nghien-cuu', title: 'Giải Ba nghiên cứu khoa học: hỗ trợ học tập cá nhân hóa', type: 'RESEARCH_PAPER', category: 'bai-bao-khoa-hoc', summary: 'Bài viết mẫu giới thiệu hành trình xây dựng đề tài gợi ý tài nguyên học tập theo tiến độ của sinh viên.', detail: 'Kịch bản minh họa mô tả quá trình xác định vấn đề, thiết kế nguyên mẫu và trình bày trước hội đồng. Nhóm ưu tiên giải thích lý do gợi ý và để người học tự lựa chọn. Thành tích được tạo phục vụ kiểm thử giao diện, không phải giải thưởng có thật.' },
];

// Additional examples cover both category tabs and multiple pages of results.
const additionalPosts: { slug: string; title: string; type: ItemType; category: string; summary: string; detail: string }[] = [
  { slug: 'mock-tuoi-cay-tu-dong', title: 'Hệ thống tưới cây tự động theo độ ẩm đất', type: 'PROJECT', category: 'robotics-iot', summary: 'Bộ điều khiển ESP32 theo dõi độ ẩm và điều chỉnh lịch tưới cho vườn thực nghiệm.', detail: 'Nguyên mẫu kết hợp cảm biến đất, bơm nước và giao diện theo dõi. Người dùng đặt ngưỡng tưới, giới hạn thời gian chạy bơm và xem lịch sử hoạt động. Kịch bản thử nghiệm gồm mất kết nối và bình chứa cạn.' },
  { slug: 'mock-canh-tay-robot', title: 'Cánh tay robot phân loại linh kiện theo màu sắc', type: 'PROJECT', category: 'robotics-iot', summary: 'Mô hình băng chuyền kết hợp camera và cánh tay robot để phân loại linh kiện trong phòng thực hành.', detail: 'Camera xác định vị trí vật thể và truyền tọa độ đến bộ điều khiển servo. Nhóm mô phỏng nhiều điều kiện chiếu sáng, ghi nhận lỗi gắp và thiết kế nút dừng khẩn cấp.' },
  { slug: 'mock-bai-do-xe', title: 'Bãi đỗ xe thông minh với cảm biến không dây', type: 'PROJECT', category: 'robotics-iot', summary: 'Theo dõi trạng thái chỗ đỗ và hiển thị số vị trí còn trống trên bảng điều khiển.', detail: 'Mỗi vị trí sử dụng cảm biến khoảng cách và gửi trạng thái về trạm trung tâm. Dữ liệu mẫu mô phỏng xe ra vào, tín hiệu chập chờn và cập nhật đồng thời từ nhiều nút.' },
  { slug: 'mock-thiet-bi-tiet-kiem-dien', title: 'Ổ cắm thông minh giám sát điện năng phòng học', type: 'PROJECT', category: 'robotics-iot', summary: 'Nguyên mẫu đo công suất thiết bị, lập lịch hoạt động và tổng hợp điện năng theo ngày.', detail: 'Dashboard hiển thị trạng thái kết nối, lịch bật tắt và dữ liệu tiêu thụ giả lập. Thiết kế phần mềm hỗ trợ giới hạn công suất và ghi nhật ký thao tác để phục vụ bài thực hành.' },
  { slug: 'mock-robot-bam-vach', title: 'Robot bám vạch phục vụ thực hành điều khiển PID', type: 'PROJECT', category: 'robotics-iot', summary: 'Bộ mô hình học tập giúp sinh viên quan sát tác động của tham số PID lên chuyển động robot.', detail: 'Nhóm xây dựng đường thử có đoạn thẳng, góc cua và vùng mất vạch. Giao diện cho phép thay đổi hệ số điều khiển và so sánh quỹ đạo giữa các lượt chạy mô phỏng.' },
  { slug: 'mock-tom-tat-van-ban', title: 'Đánh giá phương pháp tóm tắt văn bản học thuật tiếng Việt', type: 'RESEARCH_PAPER', category: 'bai-bao-khoa-hoc', summary: 'Đề cương so sánh chất lượng tóm tắt dựa trên độ bao phủ nội dung và tính nhất quán với tài liệu gốc.', detail: 'Thiết kế đánh giá kết hợp thước đo tự động với nhận xét của người đọc. Bộ dữ liệu minh họa gồm các đoạn văn giả lập; chưa có kết quả nghiên cứu thực nghiệm.' },
  { slug: 'mock-phat-hien-bat-thuong-iot', title: 'Phát hiện bất thường trong dữ liệu cảm biến IoT', type: 'RESEARCH_PAPER', category: 'bai-bao-khoa-hoc', summary: 'Khảo sát phương pháp nhận biết cảm biến mất tín hiệu, lệch ngưỡng và xuất hiện đột biến.', detail: 'Chuỗi dữ liệu tổng hợp được bổ sung nhiễu và các sự cố có nhãn. Kế hoạch đánh giá theo dõi tỷ lệ cảnh báo sai, khả năng phát hiện và độ trễ xử lý trên thiết bị biên.' },
  { slug: 'mock-do-tre-mqtt', title: 'Khảo sát độ trễ truyền dữ liệu MQTT trong mạng cảm biến', type: 'RESEARCH_PAPER', category: 'bai-bao-khoa-hoc', summary: 'Đề xuất thí nghiệm so sánh độ trễ và tỷ lệ nhận gói khi thay đổi số lượng thiết bị kết nối.', detail: 'Các cấu hình thử nghiệm thay đổi mức QoS, kích thước bản tin và tần suất gửi. Báo cáo dự kiến trình bày phân vị độ trễ cùng mức sử dụng tài nguyên máy chủ; nội dung hiện tại là dữ liệu mẫu.' },
  { slug: 'mock-tim-kiem-ngu-nghia', title: 'Tìm kiếm ngữ nghĩa cho kho tài liệu câu lạc bộ', type: 'RESEARCH_PAPER', category: 'bai-bao-khoa-hoc', summary: 'So sánh tìm kiếm từ khóa và biểu diễn vector trong bài toán truy xuất tài liệu học tập tiếng Việt.', detail: 'Nhóm xây dựng tập truy vấn mô phỏng với các cách diễn đạt đồng nghĩa. Chất lượng truy xuất được dự kiến đo bằng Recall và thứ hạng tài liệu liên quan, kèm phân tích thời gian phản hồi.' },
  { slug: 'mock-trai-nghiem-dieu-huong', title: 'Đánh giá trải nghiệm chuyển tab trong cổng học thuật', type: 'RESEARCH_PAPER', category: 'bai-bao-khoa-hoc', summary: 'Kịch bản nghiên cứu khả năng phản hồi của giao diện khi người dùng chuyển danh mục liên tục.', detail: 'Các tình huống gồm tải lần đầu, quay lại danh mục và chuyển nhanh giữa nhiều tab trong mạng chậm. Tiêu chí quan sát là thời gian hiển thị nội dung, trạng thái tải và tính nhất quán của tab đang chọn. Đây là đề cương kiểm thử giả lập.' },
];
posts.push(...additionalPosts);

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', status: 'ACTIVE', deletedAt: null } });
  if (!admin) throw new Error('Chưa có admin hoạt động. Hãy chạy npm run db:seed trước.');

  await prisma.$transaction(async (tx) => {
    const categoryIds = new Map<string, string>();
    for (const category of categories) {
      const existing = await tx.category.findUnique({ where: { slug: category.slug } })
        ?? await tx.category.findUnique({ where: { name: category.name } });
      const saved = existing ?? await tx.category.create({ data: { ...category, isNavFeatured: true, displayOrder: categoryIds.size + 1 } });
      categoryIds.set(category.slug, saved.id);
    }
    for (const [index, post] of posts.entries()) {
      const { category, detail, ...fields } = post;
      await tx.showcaseItem.upsert({
        where: { slug: post.slug },
        update: {},
        create: {
          ...fields,
          content: `DỮ LIỆU MẪU — Bài đăng giả lập phục vụ trải nghiệm NexusShowcase.\n\n${post.summary}\n\n${detail}`,
          creatorId: admin.id,
          categoryId: categoryIds.get(category),
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          scope: post.slug === 'mock-open-data-toolkit' ? 'OPEN_SOURCE' : 'INTERNAL',
          publishedYear: 2026,
          publishedAt: new Date(Date.UTC(2026, 9, 16 - index, 2)),
          contributors: { create: { userId: admin.id, role: post.type === 'RESEARCH_PAPER' ? 'FIRST_AUTHOR' : 'PROJECT_LEAD' } },
        },
      });
    }
  }, { timeout: 30000 });

  const count = await prisma.showcaseItem.count({ where: { slug: { in: posts.map(post => post.slug) }, status: 'PUBLISHED', visibility: 'PUBLIC' } });
  console.log(`Đã xác nhận ${count}/${posts.length} bài mẫu công khai (10 nghiên cứu khoa học, 10 Robotics & IoT).`);
}

main().catch(() => {
  console.error('Seed mẫu thất bại. Cần DB đã khởi tạo và admin hoạt động; chi tiết kết nối không được ghi log.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
