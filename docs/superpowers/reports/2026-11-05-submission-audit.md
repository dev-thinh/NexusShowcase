# Rà soát mục đăng bài — 2026-11-05

## Phạm vi và cấu trúc

Làm trực tiếp trên `dev`. Khảo sát các miền `identity`, `members`, `assets`, `submissions`, `review`, `publications`; tập trung luồng `/my-works/new` → tạo draft có mutation ID → `/my-works/[id]/edit` → autosave → gửi duyệt. Trang công khai là `/works/[slug]`.

Editor dùng reducer để hiển thị, `DraftSaveCoordinator` để tuần tự hóa request và giữ phiên bản, localStorage để phục hồi theo tài khoản/bài/tab. Server dùng optimistic concurrency (`reviewVersion`), transaction Serializable và receipt trong `DraftMutation`. Nội dung section là JSON có tiền tố `nexus-sections:v1`.

Đây là danh sách vấn đề tìm được trong phạm vi đọc mã và kiểm chứng dưới đây; không phải cam kết không còn lỗi khác. Không sửa logic đăng bài trong đợt này, theo yêu cầu xác định lỗi. Chỉ sửa căn lề nội dung.

## Các lỗi cần xử lý

### 1. P1 — Một bản phục hồi được tự chọn làm những bản khác biến mất khỏi giao diện

- Nguồn: `src/features/submissions/components/draft-recovery.ts:70-73`, `use-submission-editor.ts:125-135,163-169,202-213`.
- Tái hiện: để lại hai local recovery có nội dung khác nhau, cùng phiên bản server; mở lại editor. `chooseDraftRecovery` tự chọn bản mới nhất rồi trả `conflicts: []`. Những bản khác vẫn nằm trong storage nhưng không xuất hiện để đối chiếu/tải xuống. Tương tự, restore một record sẽ `setRecoveries([])` cho tất cả record đang hiển thị.
- Hệ quả: các nhánh nội dung khác bị ẩn, người dùng không biết còn bản chưa đồng bộ; không phải dữ liệu đã bị xóa khỏi localStorage.
- Bằng chứng chạy: hai record `old` và `new` → `resume: new`, `visibleConflicts: 0`. Test hiện có còn mặc định coi kết quả này là đúng.
- Hướng sửa: chỉ tự phục hồi khi không có nhánh khác biệt; giữ các bản còn lại trong panel và chỉ loại record thực sự được xử lý.

### 2. P1 — Retry lưu không bảo đảm đọc lại receipt khi dữ liệu liên quan thay đổi

- Nguồn: `src/features/submissions/server/draft-commands.ts:25-50`; `draft-mutations.ts:26-35`.
- Tái hiện theo luồng mã: save thành công nhưng client mất response; sau đó một contributor bị ẩn khỏi danh bạ. Retry cùng mutation ID bị kiểm tra contributor ở dòng 32-33 trả `VALIDATION` trước khi vào `withDraftMutation` để lấy receipt thành công. Kiểm tra quyền asset và category cũng diễn ra trước receipt.
- Hệ quả: client có thể báo lưu thất bại/conflict cho request thực tế đã commit; phiên bản client không được cập nhật, các lần lưu tiếp có thể xung đột.
- Xác nhận bằng thứ tự thực thi trong mã; chưa chạy kịch bản database đồng thời này.
- Hướng sửa: sau xác thực và kiểm tra envelope, tra receipt đúng actor/payload trước các kiểm tra phụ thuộc trạng thái hiện tại; kiểm tra dữ liệu cho mutation mới trong transaction.

### 3. P2 — Mất tên thành viên mới sau Xem trước/Soạn thảo hoặc phục hồi local

- Nguồn: `src/features/submissions/components/contributor-editor.tsx:31,68-69,188-196`; `submission-editor.tsx:68-87`.
- Tái hiện: tìm và thêm một thành viên chưa có trong `clubMembers` ban đầu. Editor chỉ lưu tên vào `knownMembers` cục bộ. Bấm Xem trước: tên được tra trong props cũ nên hiện “Thành viên”. Quay lại Soạn thảo: component được mount lại, cache tên mất, contributor có `userId` lại được render thành ô tên ngoài CLB trống.
- Local recovery có contributor mới cũng không bổ sung người đó vào props lấy từ bản server.
- Hệ quả: ID vẫn còn trong draft, nhưng hiển thị sai và cho nhập tên ngoài CLB vào một record vẫn mang user ID.
- Hướng sửa: quản lý danh sách tên ở cấp editor hoặc hydrate tất cả user ID đang có trong draft, kể cả sau restore.

### 4. P2 — Mất bản GitHub tạm giữ khi chuyển preview

- Nguồn: `src/features/submissions/components/resource-editor.tsx:12-21`; `submission-editor.tsx:68-91`.
- Tái hiện: nhập URL GitHub → tắt GitHub → Xem trước → Soạn thảo → bật lại. URL cũ chỉ được giữ ở `savedGithub` (`useRef`) của component đã unmount, nên trở thành URL trống. Trong cùng một lần mount, tắt/bật lại giữ được URL.
- Hệ quả: hành vi lưu state không nhất quán, URL đã nhập không lấy lại được qua thao tác bật lại.
- Hướng sửa: nâng cache lên editor hoặc giữ component mounted khi đổi chế độ.

### 5. P2 — Autosave làm rơi lỗi theo trường từ server

- Nguồn: `src/features/submissions/components/draft-save-coordinator.ts:9-12,80-90`; `use-submission-editor.ts:70-71,153-156`.
- Tái hiện: server trả `{code:'VALIDATION', fieldErrors:{contributors:[...]}}`. Coordinator chỉ giữ chuỗi `error`; snapshot không có `fieldErrors`, callback cũng không dispatch lỗi theo trường.
- Hệ quả: không đánh dấu trường lỗi, không mở section lỗi bị thu gọn, không focus đúng chỗ; với lỗi server về thành viên chỉ còn thông báo tổng quát.
- Bằng chứng chạy: snapshot có `status:error`, `error:Unavailable contributor`, không có `fieldErrors` dù response có.
- Hướng sửa: truyền lỗi theo trường vào snapshot/reducer, xử lý lỗi cũ theo edit sequence để không gán lỗi của nội dung cũ vào nội dung mới.

### 6. P2 — Preview hiện JSON thô khi có dữ liệu đang nhập dở hoặc vượt giới hạn

- Nguồn: `src/features/submissions/components/article-content.tsx:39-41`; `src/features/submissions/model/article.ts` (`parseArticleContent`, `articleFromLegacy`).
- Tái hiện: thêm video/link, nhập `https:/`, bấm Xem trước. Draft schema cho phép URL chưa hoàn chỉnh; editor dùng parser dành cho việc soạn thảo. Preview dùng publication parser, trả null cho cả document rồi render nguyên chuỗi có tiền tố và JSON như nội dung legacy. Một block vượt 20.000 ký tự cũng gây fallback này.
- Bằng chứng chạy: cùng content có `draftAccepted:true`, `previewParsed:false`.
- Hệ quả: toàn bộ phần nội dung preview sai, mất mục lục và hiển thị JSON nội bộ.
- Hướng sửa: preview đọc cấu trúc draft, render an toàn từng block và nêu lỗi ở block chưa hoàn tất; chỉ dùng legacy fallback cho nội dung thực sự không có tiền tố.

### 7. P2 — Cho thêm vượt 20 người rồi không thể đồng bộ draft

- Nguồn: `src/features/submissions/components/contributor-editor.tsx:65-70,89-99`; `src/features/submissions/model/input.ts:83`.
- Tái hiện: thêm người đóng góp thứ 21. Các nút thêm không chặn theo số lượng; schema lưu draft giới hạn 20.
- Hệ quả: autosave bị từ chối cho toàn bộ bản nháp, kể cả các chỉnh sửa khác, cho đến khi xóa bớt người. Bản local có thể vẫn còn; không đồng nghĩa mất toàn bộ nội dung.
- Bằng chứng chạy: schema trả false cho 21 contributor hợp lệ về các trường còn lại.
- Hướng sửa: chặn thêm ở giới hạn và giải thích giới hạn ngay tại danh sách.

### 8. P2 — Lỗi trong trường ẩn của dữ liệu cũ không có ô để sửa

- Nguồn: `src/features/submissions/components/contributor-editor.tsx:188-207`; `src/features/submissions/model/input.ts:9-12,81-83`; `src/features/submissions/model/validation-result.ts:28`.
- Tái hiện theo luồng mã: mở draft đã có `externalLink` đang nhập dở (draft schema cho phép), ví dụ `https:/`; gửi duyệt. Submission schema từ chối `externalLink`, lỗi được gộp vào dòng contributor nhưng giao diện chỉ có tên và vai trò, không có trường sửa/xóa link. `externalAffiliation` cũng tồn tại trong model nhưng không có ô chỉnh sửa.
- Hệ quả: với dữ liệu link không hợp lệ đã lưu/nhập từ hệ thống cũ, người dùng phải xóa cả contributor rồi thêm lại để vượt validation.
- Bằng chứng chạy schema: cùng input `externalLink: https:/` có `draftAccepted:true`, `submissionAccepted:false`, lỗi tại `contributors.0.externalLink`.
- Hướng sửa: cung cấp các trường tương ứng hoặc thao tác xóa metadata lỗi, giữ nguyên danh tính và vai trò.

### 9. P3 — Offline vẫn báo “Đang lưu...” như đang gửi request

- Nguồn: `src/features/submissions/components/submission-action-bar.tsx:7-13`; `draft-save-coordinator.ts:52-55`.
- Tái hiện: tắt mạng rồi sửa bài. Coordinator chuyển sang `offline`, action bar vẫn hiện “Đang lưu...”.
- Hệ quả: không phân biệt đã giữ trên thiết bị với đã lưu lên server; người dùng có thể chờ vô hạn mà không biết cần kết nối lại.
- Hướng sửa: dùng nhãn riêng cho offline và thể hiện rõ tình trạng local/server.

## Điểm UX có nguy cơ mất dữ liệu, cần thống nhất hành vi

- **Tắt thông tin hội nghị xóa toàn bộ phần vừa nhập ngay lập tức.** `conference-fields.tsx:20` ghi `null`, bật lại tạo object trống; autosave sẽ lưu trạng thái xóa. Không có cache như GitHub, undo hay xác nhận. Đây là hành vi xác định từ mã; nên giữ bản tạm trong phiên hoặc cho phép undo nếu checkbox chỉ nhằm ẩn/hiện.
- **Chuyển preview reset trạng thái giao diện con.** Ngoài lỗi cache đã nêu, section đang thu gọn, chế độ sửa vai trò, truy vấn/tình trạng tìm thành viên cũng reset do unmount. Nội dung chính vẫn ở reducer; nên tách rõ state dữ liệu và state giao diện muốn bảo toàn.

## Thay đổi căn lề đã thực hiện

Thêm `text-justify` không gắn breakpoint cho đoạn văn và danh sách trong `FormattedText`, tóm tắt trang chi tiết công khai, preview trong editor và preview xét duyệt. Nội dung structured lẫn legacy đều dùng chung renderer. Giữ nguyên căn giữa chú thích hình và cấu trúc tiêu đề.

## Kiểm chứng và giới hạn

- `npm run test:unit -- tests/unit/article-content.test.tsx tests/unit/submission-editor.test.tsx tests/unit/draft-save-coordinator.test.ts tests/unit/draft-recovery.test.ts`: do script có sẵn `tests/unit`, thực tế chạy toàn bộ **171 file, 903 test, đều đạt**.
- `npm run typecheck`: đạt.
- Script chẩn đoán riêng xác nhận các hiện tượng ở mục 1, 5, 6, 7 và khác biệt schema ở mục 8. Các mục còn lại được xác định bằng luồng mã; chưa kiểm chứng thao tác end-to-end trên hệ thống có database.
- Kiểm tra responsive riêng dùng HTML render từ `FormattedText`, phần tóm tắt cùng class và CSS Tailwind build từ repo, chạy Chrome headless. Ở các độ rộng **320, 375, 768, 1024, 1440px**, tất cả paragraph/list item trong mẫu có computed `text-align: justify`, không tràn ngang. Đây là kiểm tra renderer/căn lề, không thay thế E2E toàn trang.
- `git diff --check`: đạt.
- Không commit, push, thay đổi database hay sửa logic đăng bài.
