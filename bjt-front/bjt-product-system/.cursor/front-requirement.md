
「你是一名专业的Web前端开发人员，请严格按照提供的页面描述、布局和视觉风格，设计出高质量、响应式的前端页面。确保UI/UX友好、按钮交互明确，提供多语言支持，并考虑移动端和PC端的体验优化。」

#前端页面设计：
1.首页/产品导航页面
默认展示英文，设计一个专业的BJT产品管理系统首页。顶部导航栏包含公司logo、产品分类下拉菜单、文档下载入口、售后服务入口和语言切换器。右上角有登录按钮（无注册功能）。主体区域展示4个产品分类卡片，每个卡片包含产品线图片、名称和简短描述，有主机和配件选择链接，配料链接，备件链接。总共是4个产品线，点击链接提醒用户登录，页脚包含公司信息和联系方式。配色方案使用深蓝色(#1A365D)作为主色调，白色背景，搭配浅灰色(#F7F9FB)分区。确保响应式设计，在移动设备上导航栏转为汉堡菜单，产品卡片变为单列布局。

引用图片 1.png

2.登录页面

设计BJT系统的登录页面。页面中央是登录表单，包含BJT公司logo、"登录"标题、邮箱输入框、密码输入框（带可见性切换图标）、"记住我"复选框和蓝色突出的"登录"按钮。表单下方有"忘记密码？"链接。表单上方加入提示文字："账号由管理员分配，如需账号请联系您的客户经理"。右上角放置语言切换下拉菜单。整体使用简洁白色背景，表单区域添加轻微阴影效果增加层次感。输入框使用浅灰色边框，获得焦点时边框变为蓝色。登录按钮使用主题蓝色(#1A365D)，鼠标悬停时稍微变亮。确保在移动设备上表单元素足够大，按钮宽度占满容器。
参考图片 2.png 

3.产品及配件分类选择

设计BJT产品及配件分类浏览页。顶部有导航栏和面包屑导航（首页 > 分类名称）。页面头部展示产品线的第一个筛选属性展示产品，按照列表形式展示，单选，根据账号类型展示阶梯价格，不同账号看到的价格不一样，销售类别账号能看到库存，展示描述以及产品图片，料号，产品名称，托盘尺寸，一拖数量，有更多信息，更多信息包括包装尺寸，包装毛重，打托后总高度，点击后可以用浮层方式展示，有产品规则说明，点击后下载PDF文件，用户可以设置数量，添加到购物车；当用户选择产品后，展开一级配件，一级配件也可选择，按照产品图片，型号，料号，产品名称，电压，频率，托盘尺寸，一托数量，和产品展示一样的展示逻辑，展示阶梯价格，销售可以看到库存，展示描述和产品照片，有更多信息浮层显示，包装尺寸，包装毛重，打托后总高度，浮层显示有产品规格可以通过PDF文件下载，用户可以添加到购物车，确保价格显示正确的货币符号和单位制（公制/英制）。当用户选择一级配件后，自动展开二级配件，二级配件展示同一级配件，需要根据配件的具体情况来展示，最多展示五级，要同时支持PC端和移动端，在移动端设计中，筛选区变为可折叠抽屉式菜单，通过"筛选"按钮触发。产品卡片在小屏幕上自适应为单列布局。使用蓝色主色调和灰色辅助色，保持品牌一致性。
页面中有浮动的购物车，点击购物车后在浮层里预览当前购物车商品，不要跳出当前页面，


参考图片3.png

4.产品料耗选择

设计BJT耗材分类选择页面。顶部有导航栏和面包屑导航（首页 > 分类名称）。页面头部展示耗材的选项，包括Model,Unit,shape,shape显示时有示例图片，Material选择，当选择为paper相关属性时，下一级筛选项为weight，width，Length，当为其他类型材料时将weight修改为Thickness筛选项，选项可以重置，当选项确定后展示列表，包括编号，产品图片，spec，属性，适配型号，库存，阶梯价格，料号，，根据账号类型展示阶梯价格，不同账号看到的价格不一样，销售类别账号能看到库存，有更多信息，更多信息包括包装材质，以及选项中公制或者英制的厚度，克重，膜宽，袋长信息，移动端设计中，筛选区变为可折叠抽屉式菜单，通过"筛选"按钮触发。产品卡片在小屏幕上自适应为单列布局。使用蓝色主色调和灰色辅助色，保持品牌一致性。
页面中有浮动的购物车，点击购物车后在浮层里预览当前购物车商品，不要跳出当前页面，
参考页面4

5.产品备件选择页面
设计BJT备件分类选择页面。顶部有导航栏和面包屑导航（首页 > 分类名称）。页面头部展示Model选项，接下来是Consumable non-consumable筛选项，以列表形式展示备件
显示备件的产品图片，料号，名称，适配序列号，包装尺寸，包转毛重，根据用户的账号类别展示不同的阶梯价格，如果是销售账号展示库存，用户可以添加数量以及购物车，购物车可以在当前页面预览和操作，不要跳出当前页面，要支持PC端，同时做移动端适配
参考页面5

6.购物车页面，
设计BJT系统购物车页面。顶部显示"购物车"标题和购物进度指示器（购物车>确认订单>完成）。主体是购物车表格，包含表头：商品图片、商品信息、单价、数量、小计金额和操作。每行商品信息包含：缩略图、商品名称、型号、SKU和"More Info"/"Specification"按钮。数量列使用数字输入框配合+-按钮。操作列包含"删除"按钮（垃圾桶图标）。库存不足商品行以浅红色背景高亮，并显示醒目的"库存不足"标签。表格下方右侧是费用摘要卡片，列出商品总额、预估运费（标注"结算时计算"）、总计金额，以及醒目的"结算"按钮和"继续购物"链接。价格根据用户类型和地区显示对应货币符号。移动端设计中，表格转为卡片式布局，每个商品单独成卡片，垂直排列。使用一致的蓝色主题，确保关键按钮如"结算"使用高对比度颜色突出显示。

参考图片6

7. 提交确认页
    设计BJT提交确认页面。顶部显示"确认订单"标题和购物进度指示器（购物车>确认订单>完成，当前在"确认订单"）。页面分为左右两栏（移动端则垂直排列）。左侧是表单区域，包含收货信息表单：联系人、电话、邮箱、国家/地区（下拉选择）、详细地址等字段，每个必填项标有星号。右侧是订单摘要区，顶部显示"订单明细"，列出所有商品信息（图片、名称、数量、单价）。库存不足商品以红色文字标注"库存不足"。摘要底部显示费用计算：商品总额、运费（显示"正在计算..."动态加载，调用物流API后显示具体金额）、税费（如适用）和订单总额。页面底部是操作按钮区：一个主要的"生成PO订单"按钮，以及条件满足时显示的"Order"按钮（如不满足条件，则显示灰色禁用状态，鼠标悬停显示不可用原因）。设计需要清晰区分不同信息区块，表单元素大小适中，确保移动端上操作方便。使用一致的蓝色主题，突出显示关键按钮。

    参考页面7

8.生成PO页
设计BJT生成PO订单页面，呈现专业采购单据风格。顶部显示BJT公司logo和"采购订单"标题，右上角显示PO编号和日期。下方分为3个区域：1)客户信息区 - 左侧显示购买方信息（公司名称、联系人、地址、电话），右侧显示收货信息；2)商品信息区 - 使用专业表格布局，包含列：序号、商品编码、商品名称、规格、单位、数量、单价、金额，表格底部是汇总行；3)汇总区 - 右对齐，清晰列出商品总额、运费、税费和最终总计金额。页面顶部有醒目的"导出Excel"和"打印PO单"按钮，底部有"返回"和"完成"按钮。采用打印友好设计，以白色背景和黑色文字为主，关键数据如总金额使用加粗字体。表格使用细线边框，隔行使用极浅的灰色背景增加可读性。确保在各种屏幕上都能完整显示，移动端上调整为上下滚动的单列布局。

9.order支付页面
设计BJT系统Order支付页面。顶部展示"订单支付"标题和订单号。页面主体分为左右两部分（移动端上下排列）。左侧是支付方式选择区，顶部有"请选择支付方式"提示，下方根据用户所属地区显示不同支付选项，每个选项包含支付方式图标和名称，如PayPal、信用卡、地区分公司支付网关等，以单选按钮形式选择。右侧是订单摘要，使用卡片式设计，显示关键订单信息：主要商品缩略图和名称、商品数量、总商品金额、运费、税费和最终支付金额（金额使用大号加粗字体突出显示）。页面底部有"确认支付"（主色调按钮）和"返回修改"（次要按钮）。整体设计使用白色背景，支付部分可使用浅灰色背景增加安全感。在支付金额附近添加安全支付图标和简短说明。确保在移动设备上支付方式选择区域有足够大的点击区域，防止误操作。

10.订单列表页
设计BJT订单列表页面。顶部有"我的订单"标题和订单状态筛选选项卡（全部、待付款、待发货、已发货、已完成、已取消），当前选中状态用底部蓝色边框标识。选项卡下方是高级筛选区，包含时间范围选择器和搜索框。主体是订单卡片列表，每个订单卡片包含：订单号、下单时间、订单状态标签（使用不同颜色区分状态）、订单总金额、支付方式、收货信息摘要，以及操作按钮（查看详情、导出PO文档等，根据订单状态显示不同操作）。每个订单卡片下方有"展开查看商品"按钮，点击后显示订单包含的商品缩略图和基本信息。使用分页控件，底部显示"第X页/共Y页"和页码导航。设计需保持简洁清晰的信息层次，使用卡片阴影和不同背景色区分不同信息区域。移动端上保持卡片式设计，减少每张卡片显示的信息量，确保关键信息和操作按钮优先展示。

11.订单详情页
设计BJT订单详情页面。顶部显示"订单详情"标题、订单号和下单时间。下方是订单状态时间线，水平排列显示订单各阶段（下单、支付、发货、签收等），使用蓝色圆点标记已完成阶段，空心圆点标记未完成阶段，连接线表示流程顺序。主体内容分为三个卡片区：1)收货信息卡片 - 显示收件人、联系电话、收货地址等；2)商品信息卡片 - 表格列出订单中的所有商品，包含图片、名称、规格、单价、数量、小计，每个商品有"Specification"和"More Info"按钮；3)费用信息卡片 - 清晰列出商品总额、运费、税费、订单总额，如有改价情况，使用删除线显示原价，红色显示新价格。右上角设置"导出PO文档"按钮。如已发货，在状态时间线下方增加物流信息区，显示物流公司、运单号和简要跟踪状态，并提供"查看物流详情"链接。页面底部有"返回订单列表"链接。移动端设计中垂直排列各信息区块，状态时间线改为简化版本，确保关键信息优先展示。

12.物流跟踪页

设计BJT系统物流跟踪页面。顶部显示"物流跟踪"标题、订单号和发货日期。正下方是主要物流信息卡片，清晰展示：物流公司名称、物流单号（带复制按钮）、包裹重量和预计送达日期。中央区域是垂直物流时间线，从上到下按时间倒序排列显示包裹配送各状态节点，使用蓝色实心圆点标记当前状态，并用加粗字体突出显示。每个节点包含：状态描述、时间、地点和操作员信息（如有）。时间线右侧是示意图，直观展示包裹在物流链上的位置（例如：仓库、转运中心、配送车辆、目的地等）。页面右上角显示上次数据更新时间和刷新按钮。页面底部显示数据来源说明（"数据由XX物流提供"）和"返回订单详情"链接。整体使用简洁的设计风格，信息层次分明。在移动设备上，保持垂直时间线设计，但精简每个节点显示的信息，确保清晰可读。

13.发票查看与下载页面
设计BJT系统发票查看/下载页面。顶部有"发票详情"标题和发票编号。主体分为左右两区域（移动端上下排列）。左侧占页面70%宽度，是嵌入式PDF预览区，显示发票内容，带有简单的预览控制栏（放大/缩小、页面跳转、全屏查看）。右侧是发票信息卡片，显示关键元数据：发票号、开具日期、关联订单号（带链接可跳转至订单详情）、发票金额和币种。右侧顶部有醒目的蓝色"下载PDF"按钮，下方有"打印发票"链接。PDF预览区应有适当的边框和阴影，清晰界定预览区域。如果PDF加载中或无法加载，显示相应的加载动画或错误提示，并提供直接下载选项。页面底部有"返回订单详情"链接。移动端设计中，调整为先显示发票信息和下载按钮，再显示预览区域，预览区高度适中，可通过触摸手势缩放查看。整体设计简洁专业，信息排版清晰。

14.个人信息与账号页
设计BJT系统个人中心页面。左侧是垂直导航菜单，包含选项：账户信息（默认选中）、订单管理、地址管理、密码修改等，选中项以蓝色背景和左侧蓝色条标识。右侧是内容区，顶部显示"账户信息"标题和最后登录时间。内容区分为多个信息卡片：1)基本信息卡片 - 显示用户名、邮箱、公司名称，有部分字段的"编辑"按钮；2)账户类型卡片 - 显示用户类型（代理商/C端会员/公司销售）、客户代码、关联仓库等只读信息；3)偏好设置卡片 - 显示所属地区、计量单位偏好（公/英制），带有编辑选项。编辑状态下，使用下拉选择器或单选按钮组便于修改。页面右上角显示用户头像和姓名。确保表单元素大小适中，编辑区域有明确的"保存"和"取消"按钮。移动端设计中，导航菜单改为顶部选项卡或下拉菜单，各信息卡片垂直排列，保持信息的完整性和可读性。使用一致的卡片式设计和蓝色主题。

15.密码修改页面
设计BJT系统密码修改页面。页面居中显示密码修改表单卡片，顶部有"修改密码"标题。表单包含三个密码输入字段：当前密码、新密码和确认新密码，每个字段右侧都有眼睛图标按钮切换密码可见性。新密码字段下方显示密码要求提示："密码长度至少8位，必须包含字母、数字和特殊符号"。表单包含实时密码强度指示器，使用多段式彩色条显示强度等级（弱/中/强），颜色从红到绿渐变。当用户输入新密码时，实时验证并在密码下方显示符合/不符合要求的状态。表单底部有"取消"（灰色）和"保存修改"（蓝色）按钮。如输入有误（如两次密码不一致），显示红色错误提示并禁用保存按钮。整体使用简洁的设计风格，表单元素间距适中，在移动设备上保持良好的大小和间距，确保输入框和按钮有足够的点击区域。使用卡片阴影增加层次感，突出表单区域。

16.帮助中心/FAQ页面
设计BJT系统帮助中心/FAQ页面。顶部有"帮助中心"标题和搜索框（带放大镜图标和"搜索问题..."占位文字）。下方是分类导航标签栏，包含"账户管理"、"产品选购"、"订单与支付"、"物流配送"、"售后服务"等类别，当前选中类别用蓝色底边线标识。主体区域使用手风琴式折叠面板列表展示问题和答案，每个问题项包含问题标题和右侧展开/折叠箭头图标。点击问题区域展开显示答案内容，答案区使用浅灰色背景和适当缩进。页面右侧（移动端则在底部）显示"联系客服"卡片，包含客服邮箱、工作时间和"发送邮件"按钮。问题列表底部有分页控件。确保页面响应式设计，在小屏幕上分类标签可水平滚动，问题和答案保持良好的可读性。使用一致的蓝色主题，适当使用图标增强视觉辅助效果。确保多语言支持，右上角保留语言切换功能。

17.文档下载入口页面
设计BJT系统文档下载入口页面。页面简洁明了，中央区域是一个突出的信息卡片。卡片顶部有"产品文档下载"标题和简短说明："您即将跳转到Lockedair官方文档中心，在那里您可以获取产品手册、技术规格书和其他相关文档。"中央是大型、醒目的蓝色"前往下载页面"按钮，按钮下方显示目标URL:"www.lockedair.com/document-download"。卡片底部有补充说明："本站外部链接将在新窗口打开"和BJT与Lockedair的关系简述。背景可使用淡蓝色渐变或简洁的技术文档图案作为衬托，增强科技感。确保按钮有悬停效果，如轻微放大或颜色变化。在移动设备上保持卡片居中设计，确保按钮足够大，便于触摸操作。页面右上角保留"返回上一页"链接，方便用户取消操作。整体设计保持与BJT系统其他页面的视觉一致性。

18.产品文档链接页面
设计BJT系统产品文档链接页面。这是从订单历史点击特定产品文档按钮后的跳转页面。顶部清晰显示产品名称和型号，如"E4S压力传感器技术文档"。中央是信息卡片，卡片内有产品小图片和简要参数，下方是说明文字："您正在访问此产品的技术文档。点击下方按钮跳转到Lockedair官方文档中心查看详细资料。"中央放置大型蓝色按钮"查看产品文档"，按钮下方显示目标URL（如https://www.lockedair.com/document-download/?q=E4S）。在卡片底部增加补充信息："文档包含产品规格、安装指南、使用手册等内容"。页面设计简洁明了，目的是快速引导用户完成跳转。右上角明显位置设置"返回订单详情"链接。确保整个页面响应式设计，在移动设备上保持关键信息清晰可读，按钮足够大，便于点击。使用与系统一致的蓝色主题和字体风格。

19.售后问题反馈页面
设计BJT系统售后问题反馈页面。顶部有"售后服务支持"标题和简短说明："请填写以下信息，我们的售后团队将尽快与您联系"。主体是表单区域，分为三个部分：1)联系信息部分 - 包含联系人姓名、电话、电子邮箱等字段，必填项标有红色星号；2)产品信息部分 - 包含产品型号（选填，带搜索功能的下拉框）、购买日期（日期选择器）等字段；3)问题描述部分 - 包含问题类型下拉选择和问题详细描述多行文本框。表单下方是文件上传区域，有拖放区域和"选择文件"按钮，支持上传图片和视频（最大5个文件），显示已上传文件预览缩略图和删除选项。表单底部有"提交"（蓝色主按钮）和"重置"（灰色次要按钮）。页面底部包含隐私声明简短文字和完整隐私政策链接。整体设计简洁清晰，表单分组明确，字段布局整齐。移动端设计中，调整为单列布局，确保每个输入字段和上传区域有足够大小，便于操作。

20.维修工单记录页面（用户端）
设计BJT系统用户端维修工单记录页面。顶部有"维修工单记录"标题和状态筛选选项卡（全部、处理中、已完成、已取消）。选项卡下方是工单列表，采用卡片式设计，每个工单卡片包含：工单编号、提交日期、产品型号、问题简述和状态标签（使用不同颜色标识：黄色-处理中，绿色-已完成，灰色-已取消）。每个卡片右侧有"查看详情"按钮。点击卡片或详情按钮后展开显示完整工单信息：详细问题描述、上传的图片/视频缩略图（可点击查看大图）、客服反馈记录（如有）等。卡片底部显示最新更新时间。如果工单需要用户进一步操作，显示明显的提示和操作按钮。页面设计简洁明了，使用统一的卡片样式和状态颜色编码。移动端设计保持卡片式布局，调整为单列，确保状态标签和操作按钮足够明显。页面底部有分页控件，允许浏览更多历史工单。

21.退货申请页面

设计BJT系统退货申请页面。顶部显示"退货申请"标题和简短说明："请填写以下信息申请退货，我们将在1-2个工作日内处理您的申请"。页面分为两部分：1)选择退货商品区域 - 显示最近订单中的商品卡片列表，每个卡片包含商品图片、名称、订单号、购买日期和单选按钮，用户需选择一个退货商品；2)退货信息表单 - 包含退货原因下拉选择（选项如"商品损坏"、"收到错误商品"等）、详细说明文本框、退货凭证上传区（支持拖放图片，显示上传预览）。表单下方有退货政策摘要区，使用浅黄色背景和信息图标，简要列出关键政策点如"商品必须在购买后30天内申请退货"等，并提供"查看完整退货政策"链接。页面底部有"提交申请"（蓝色主按钮）和"取消"（灰色次要按钮）。设计需确保表单分区明确，操作流程清晰，移动端设计中调整为单列垂直布局，确保选择区域和表单元素有足够大小，便于触摸操作。

22.退货处理状态页面
设计BJT系统退货处理状态页面。顶部显示"退货申请状态"标题、退货申请编号和提交日期。中部设计为水平状态时间线（移动端改为垂直），清晰展示退货流程各阶段：1)申请提交（带绿色对勾）；2)审核中（当前状态高亮显示）；3)申请批准/拒绝；4)等待退回商品；5)商品检验中；6)退款处理中；7)退货完成。时间线使用蓝色圆点标记当前阶段，灰色圆点表示未到达阶段，绿色对勾表示已完成阶段，连接线显示流程顺序。时间线下方是详细信息卡片，显示退货商品图片、名称、退货原因、申请说明等信息。如申请被拒绝，使用醒目的橙色或红色信息框显示拒绝原因。卡片底部显示处理记录，时间倒序排列每条处理状态更新。页面右侧（移动端底部）是"客服支持"卡片，包含联系方式和工作时间。页面底部有"返回"按钮。整体设计简洁明了，使用颜色和图标增强视觉引导，确保用户能清晰了解当前退货处理状态。

23.语言切换组件（所有页面通用）

设计BJT系统的语言切换组件，作为所有页面的通用元素。组件位于页面右上角，导航栏区域。默认状态显示当前选中语言的国旗图标和语言名称（如"English"），右侧有小型下拉箭头。点击后展开下拉菜单，列出所有可选语言选项：每个选项包含国旗图标、语言名称和语言代码（如"中文 (ZH)"），当前选中语言有浅蓝色背景高亮。组件整体设计简约，常态下占用空间小但可识别性强。下拉菜单使用白色背景和轻微阴影，确保在各种页面背景上都有良好可见度。悬停效果为选项背景变为浅灰色。在移动设备上，组件可能被收入汉堡菜单中，但展开后保持相同的视觉设计。确保点击区域足够大，便于触摸操作。组件状态变化时提供适当的视觉反馈，如选中新语言后菜单收起，页面内容无刷新切换为选择的语言。

24.忘记密码页面
设计BJT系统的忘记密码页面。页面顶部有BJT公司logo，下方是标题"重置密码"。中央区域是简洁的表单，包含邮箱输入框和蓝色"发送重置链接"按钮。表单上方有简短说明："请输入您的注册邮箱，我们将发送密码重置链接至该邮箱"。表单下方提供"返回登录页面"链接和客服联系方式："遇到问题？请联系客服：support@bjt.com"。页面整体采用白色背景，表单区域添加轻微阴影，与登录页保持一致的设计语言。确保在各种屏幕尺寸上表单居中显示，在移动设备上保持良好的间距和按钮大小。页面右上角保留语言切换下拉菜单。




. Core Concept:
The page should display individual Host Machine Parts (e.g., LA-E4S 220V - Part Number 13A00001), not just the parent Host Models (e.g., LA-E4S).
Data will be fetched using the new MachinePart interface and the getMockMachineParts function from frontend/src/services/mocks/machines.mocks.ts.
2. Filtering:
Requirement: Filter by Voltage (电压).
Implementation: The index.tsx component has a handleVoltageChange function and likely uses state (selectedVoltage) to manage this, which aligns with the requirement.
3. List/Table Display:
Requirement Fields: Image, Model, Part Number, Name, ProductID (Part ID), Voltage, Frequency(?), Pcs per Box, Pallet Size (cm/inch), Pcs per Pallet.
Implementation (renderMachinesTable, renderProduct - requires refactor):
Needs to iterate over MachinePart[] instead of MachineProduct[].
Display fields should map to MachinePart properties:
Image: MachinePart.image_url (from wp_bjt_parts) seems most appropriate for the specific part variant.
Model: MachinePart.model
Part Number: MachinePart.part_number
Name: MachinePart.name_zh / name_en
ProductID: MachinePart.id (the part's ID from wp_bjt_parts)
Voltage: MachinePart.voltage
Frequency: Missing in MachinePart and wp_bjt_parts. This needs to be added to the data source and interface if required by the frontend.
Pcs per Box: MachinePart.pcs_per_box
Pallet Size: MachinePart.pallet_size_cm / pallet_size_inch
Pcs per Pallet: MachinePart.pcs_per_pallet
Cart Display: Requirements indicate the same fields as the list. The handleAddToCart function needs to work with MachinePart objects/IDs.
4. Tooltip Display:
Requirement Fields: Package Size (cm/inch), Net Weight (kg/lbs), Pallet Height (cm/inch), Pallet Gross Weight (kg/lbs), PDF Download link.
Implementation: Tooltip rendering logic needs to access the corresponding fields from the MachinePart object (e.g., package_size_cm, net_weight_kg, pallet_height_cm, pallet_gross_weight_kg, model_explosion_diagram_pdf).
5. Accessory Logic:
Requirement: Selecting a product (now a MachinePart) should show related accessories, potentially in multiple levels (up to 5).
Implementation (handleMachineSelection, handleAccessorySelection, renderAccessory, showAccessoryLevels):
This is the most significant area needing change.
Currently, handleMachineSelection likely uses a MachineProduct ID. It must be adapted to use the selected MachinePart.part_number.
Accessory data fetching needs to use the wp_bjt_relations table logic (linking parent_part_number to child_part_number where child_type is 'accessory'). This requires mocking the relations data or implementing the corresponding API call.
The multi-level display logic (showAccessoryLevels, renderAccessoryPath, renderAccessory) will need to function based on this new relationship structure.
6. Other Implementation Details:
Data Fetching: fetchMachines needs to call the service function that returns MachinePartListData.
State: State variables like machines should hold MachinePart[]. Helper functions (getMachineName, getMachineDescription, etc.) need to accept MachinePart and use its fields.
Pricing/Inventory: Functions like formatPrice and getRegionInventory need to use the prices and inventory arrays within the selected MachinePart.
Immediate Next Steps:
Fix Linter Errors in machines.mocks.ts: Before refactoring the index.tsx page, we must fix the errors introduced in the mock file:
Correct the import paths for PriceTier and InventoryData (they likely reside in frontend/src/types/common.ts or similar).
Resolve the "duplicate 'id'" error caused by spreading hostModelsData. We should exclude or rename the id from hostModelsData when merging.
Refactor MachinesPage (index.tsx): Adapt the component to fetch, manage state for, and render MachinePart data instead of MachineProduct. Update display fields, helper functions, and event handlers accordingly.
Implement/Mock Accessory Relations: Address the accessory display logic by either mocking the relations data or implementing the necessary service calls based on wp_bjt_relations.
Shall we start by fixing the linter errors in frontend/src/services/mocks/machines.mocks.ts?




Okay, I understand. You want the specific dark theme we just discussed (with colors like page background `#131B29`, card background `#1A2535`, etc.) to be the **default appearance** of the Machines page. However, you also want this to be implemented in a way that it can **still adapt and change if you use your theme switcher**.

Essentially, the dark theme colors you provided should be the baseline, and the theme switcher should be able to override these when a different theme is selected. This means we need to use CSS variables for all themeable colors, set their default values to your specified dark theme, and ensure Tailwind CSS uses these variables.

To proceed, here's a clear and detailed prompt you can give me. This will help ensure I address all your requirements accurately:

---

"Please implement a dynamic theming system for the Machines page (`frontend/src/pages/Machines/index.tsx`).

The **default theme** should be a specific dark theme with the following color palette:

*   **Page Background:** `#131B29`
*   **Card Background:** `#1A2535`
*   **Card Border:** `#2A3A4A`
*   **Input Field / Alternative Card Background (e.g., for spec details box):** `#1D2A3A`
*   **Main Text Color (General Content):** `#E0E0E0` (Light Gray)
*   **Secondary/Label Text Color (e.g., '料号:', '选择'):** `#A0A0A0` (Medium Gray)
*   **Title Text Color (e.g., product names, section titles):** `#FFFFFF` (White)
*   **Primary Action Color (e.g., selected radio button, 'Add to Cart' button background):** `#4E9EFE` (Bright Blue)
*   **Primary Action Hover Color (e.g., 'Add to Cart' button hover):** `#2D7DE0` (Darker Bright Blue)
*   **Price Text Color:** `#A37CFD` (Purple)
*   **Secondary Button Background (e.g., '规格详情', '更多信息'):** `#2A3A4A`
*   **Secondary Button Text Color:** `#8AC6FF` (Light Blue)
*   **Secondary Button Hover Background:** `#3A4A5A`
*   **Quantity Control Button Background (+/- buttons):** `#2A3A4A`
*   **Quantity Control Button Border:** `#3A4A5A`
*   **Quantity Control Button Text Color:** `#D1D5DB` (text-gray-300 equivalent)
*   **Accessory Level Tag Backgrounds & Corresponding Text Colors (ensure good contrast, e.g., white or very light text):**
    *   Level 1: Background `#1A5A9A` (Dark Blue), Text `#FFFFFF`
    *   Level 2: Background `#1A8A6A` (Green), Text `#FFFFFF`
    *   Level 3: Background `#AA8A2A` (Dark Yellow/Ochre), Text `#FFFFFF`
    *   Level 4: Background `#AA5A2A` (Orange), Text `#FFFFFF`
    *   Level 5: Background `#AA2A2A` (Red), Text `#FFFFFF`

**Implementation Requirements:**

1.  **CSS Custom Properties (Variables):**
    *   Define these default dark theme colors using CSS custom properties in a global CSS file. Please use `frontend/src/styles/global.css` for this, or let me know if another file like `frontend/src/styles/variables.css` is preferred (if so, ensure it's imported correctly in `main.tsx` or `App.tsx`).
    *   Use semantic variable names, for example:
        *   `--color-background: #131B29;`
        *   `--color-card-bg: #1A2535;`
        *   `--color-border: #2A3A4A;`
        *   `--color-text-content: #E0E0E0;`
        *   `--color-primary: #4E9EFE;`
        *   `--color-accessory-level-1-bg: #1A5A9A;`
        *   `--color-accessory-tag-text: #FFFFFF;` (a generic one for tags if text color is consistent)
        *   ...and so on for all specified colors.

2.  **Tailwind CSS Configuration:**
    *   Locate the `tailwind.config.js` file in the `frontend` directory. If it doesn't exist, please guide me on creating a basic one.
    *   Configure Tailwind's `theme.extend.colors` section to use these CSS custom properties. For example:
        ```javascript
        module.exports = {
          // ...
          theme: {
            extend: {
              colors: {
                background: 'var(--color-background)',
                card: {
                  DEFAULT: 'var(--color-card-bg)',
                  alt: 'var(--color-input-bg)', // for alternate card backgrounds
                },
                border: 'var(--color-border)',
                primary: {
                  DEFAULT: 'var(--color-primary)',
                  dark: 'var(--color-primary-dark)',
                },
                price: 'var(--color-price)',
                content: {
                  DEFAULT: 'var(--color-text-content)',
                  light: 'var(--color-text-label)', // for slightly lighter/less emphasized text
                },
                title: 'var(--color-text-title)',
                label: 'var(--color-text-label)',
                input: {
                  DEFAULT: 'var(--color-input-bg)',
                },
                button: {
                  DEFAULT: 'var(--color-button-bg)', // For generic buttons if needed
                  secondary: {
                    DEFAULT: 'var(--color-secondary-button-bg)',
                    text: 'var(--color-secondary-button-text)',
                    hover: 'var(--color-secondary-button-bg-hover)',
                  },
                  quantity: {
                     DEFAULT: 'var(--color-quantity-button-bg)',
                     border: 'var(--color-quantity-button-border)',
                     text: 'var(--color-quantity-button-text)',
                  }
                },
                // Accessory Tags
                'level-1-bg': 'var(--color-accessory-level-1-bg)',
                'level-2-bg': 'var(--color-accessory-level-2-bg)',
                'level-3-bg': 'var(--color-accessory-level-3-bg)',
                'level-4-bg': 'var(--color-accessory-level-4-bg)',
                'level-5-bg': 'var(--color-accessory-level-5-bg)',
                'tag-text': 'var(--color-accessory-tag-text)',
                // ... other semantic color names based on the variables
              },
            },
          },
          // ...
        };
        ```

3.  **Component Styling (`frontend/src/pages/Machines/index.tsx`):**
    *   Ensure all relevant JSX elements use the Tailwind utility classes that correspond to these semantic theme color names (e.g., `bg-background`, `text-primary`, `border-border`, `bg-card`, `text-content`, `bg-level-1-bg`, `text-tag-text`, etc.). The page should render with the specified dark theme by default due to the CSS variable definitions.

4.  **Dynamic Theme Switching Compatibility:**
    *   The entire setup must allow an external theme switcher to dynamically change the values of these CSS custom properties at runtime. This will enable the page's appearance to change according to the selected theme, overriding the default dark theme values.

The primary goal is for the page to load with this specific dark theme as its default state, powered by CSS variables that can be dynamically updated by a theme selection mechanism."



1. consumable 页面的展示逻辑

1.1 筛选项：
适用机型
袋型
材质
"厚度/克重 um/gsm"	
"厚度/克重 mil/#"	
"膜宽 cm"
"膜宽 inch"
"袋长 cm"
"袋长 inch"

1.2购物车/列表展示：
"产品图片 袋型实物"
料号	
型号
型号(英制)
Spec.
Spec.(英制)
"泡径 cm"
"泡径 inch"
productId
单箱数量


1.3tooltip展示：
材质
"厚度/克重 um/gsm"
"厚度/克重 mil/#"
"膜宽 cm"	
"膜宽 inch"	
"袋长 cm"
"袋长 inch"
"总长 m"
"总长 ft"	

包装属性
Package Info
包装方式	
"包装尺寸 cm"	
"包装尺寸 inch"
"单件净重 kg"
"单件净重 lbs"
包装实物图片
"托盘尺寸 cm"

打托属性
Pallet Info

一托卷数A	
"整托毛重A kg"	
"整托毛重A lbs"
"打托高度A cm"
"打托高度A inch" 
一托卷数B	
"整盘毛重 kg"	
"整盘毛重B lbs"
"打托高度 cm"	
"打托高度B inch"	
一托卷数C
"整托毛重 kg"
"整托毛重C lbs"
"打托高度C cm"
"打托高度C inch"
"纸筒内径 cm"
"纸筒内径 inch"

购物车展示：


CREATE TABLE IF NOT EXISTS `wp_bjt_consumables` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `model_imperial` varchar(100) COMMENT '型号(英制)',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `spec` varchar(255) COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) COMMENT '规格参数(英制)',
  `brand` varchar(100) COMMENT '品牌',
  `app_model` varchar(255) COMMENT '适用机型',
  `bag_type` varchar(100) COMMENT '袋型',
  `material` varchar(100) COMMENT '材质',
  `thickness_met` decimal(10,2) COMMENT '厚度/克重(um/gsm)',
  `thickness_imp` decimal(10,2) COMMENT '厚度/克重(mil/#)',
  `width_met` decimal(10,2) COMMENT '膜宽(cm)',
  `width_imp` decimal(10,2) COMMENT '膜宽(inch)',
  `length_met` decimal(10,2) COMMENT '袋长(cm)',
  `length_imp` decimal(10,2) COMMENT '袋长(inch)',
  `bubble_diameter_met` decimal(10,2) COMMENT '泡径(cm)',
  `bubble_diameter_imp` decimal(10,2) COMMENT '泡径(inch)',
  `total_length_met` decimal(10,2) COMMENT '总长(m)',
  `total_length_imp` decimal(10,2) COMMENT '总长(ft)',
  `package_type` varchar(100) COMMENT '包装方式',
  `package_size_cm` varchar(100) COMMENT '包装尺寸(cm)',
  `package_size_inch` varchar(100) COMMENT '包装尺寸(inch)',
  `net_weight_kg` decimal(10,2) COMMENT '单件净重(kg)',
  `net_weight_lbs` decimal(10,2) COMMENT '单件净重(lbs)',
  `gross_weight_kg` decimal(10,2) COMMENT '包装毛重(kg)',
  `gross_weight_lbs` decimal(10,2) COMMENT '包装毛重(lbs)',
  `pcs_per_box` int(11) COMMENT '单箱数量',
  `image_url` varchar(255) COMMENT '产品图片(袋型实物)',
  `package_image_url` varchar(255) COMMENT '包装实物图片',
  `pallet_size_cm` varchar(100) COMMENT '托盘尺寸(cm)',
  `pallet_size_inch` varchar(100) COMMENT '托盘尺寸(inch)',
  `pcs_per_pallet_a` int(11) COMMENT '一托卷数A',
  `pallet_gross_weight_a_kg` decimal(10,2) COMMENT '整托毛重A(kg)',
  `pallet_gross_weight_a_lbs` decimal(10,2) COMMENT '整托毛重A(lbs)',
  `pallet_height_a_cm` decimal(10,2) COMMENT '打托高度A(cm)',
  `pallet_height_a_inch` decimal(10,2) COMMENT '打托高度A(inch)',
  `pcs_per_pallet_b` int(11) COMMENT '一托卷数B',
  `pallet_gross_weight_b_kg` decimal(10,2) COMMENT '整托毛重B(kg)',
  `pallet_gross_weight_b_lbs` decimal(10,2) COMMENT '整托毛重B(lbs)',
  `pallet_height_b_cm` decimal(10,2) COMMENT '打托高度B(cm)',
  `pallet_height_b_inch` decimal(10,2) COMMENT '打托高度B(inch)',
  `pcs_per_pallet_c` int(11) COMMENT '一托卷数C',
  `pallet_gross_weight_c_kg` decimal(10,2) COMMENT '整托毛重C(kg)',
  `pallet_gross_weight_c_lbs` decimal(10,2) COMMENT '整托毛重C(lbs)',
  `pallet_height_c_cm` decimal(10,2) COMMENT '打托高度C(cm)',
  `pallet_height_c_inch` decimal(10,2) COMMENT '打托高度C(inch)',
  `tube_inner_diameter_cm` decimal(10,2) COMMENT '纸筒内径(cm)',
  `tube_inner_diameter_inch` decimal(10,2) COMMENT '纸筒内径(inch)',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`, `part_number`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_model` (`product_line_id`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材表';


2. 备件页面的展示逻辑

2.1 筛选项：
主机或者配件
适用机型
是否易损 

2.2购物车/列表展示：
适配机型
产品图片	
料号	 
名称	
Spec.	
适配序列号	
单箱数量	


2.3tooltip展示：
"包装尺寸 cm"	
"包装尺寸 inch"	
"单件净重 kg"	
"单件净重 lbs"	

-- Spare Parts Table
CREATE TABLE IF NOT EXISTS `wp_bjt_spare_parts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `app_model` varchar(255) COMMENT '适配机型',
  `is_consumable` tinyint(1) DEFAULT 0 COMMENT '是否易损',
  `image_url` varchar(255) COMMENT '产品图片',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `spec` varchar(255) COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) COMMENT '规格参数(英制)',
  `app_sn` varchar(255) COMMENT '适配序列号',
  `package_size_cm` varchar(100) COMMENT '包装尺寸(cm)',
  `package_size_inch` varchar(100) COMMENT '包装尺寸(inch)',
  `net_weight_kg` decimal(10,2) COMMENT '单件净重(kg)',
  `net_weight_lbs` decimal(10,2) COMMENT '单件净重(lbs)',
  `gross_weight_kg` decimal(10,2) COMMENT '包装毛重(kg)',
  `gross_weight_lbs` decimal(10,2) COMMENT '包装毛重(lbs)',
  `pcs_per_box` int(11) COMMENT '单箱数量',
  `required_parts` text COMMENT '必选备件料号，多个用逗号分隔',
  `required_quantity` text COMMENT '必选备件数量，多个用逗号分隔，与必选备件料号一一对应',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`, `part_number`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备件料号表';


3.machine页面展示逻辑
3.1筛选项：
主机列表展示可以选择筛选
电压

3.2 列表展示项
产品图片
型号
料号
产品名称
PRODUCTID
"电压 V"
"频率 Hz"
单箱数量
"托盘尺寸 cm"
"托盘尺寸 inch"
一托数量

3.2.2 购物车展示项
产品图片
型号
料号
产品名称
PRODUCTID
"电压 V"
"频率 Hz"
单箱数量
一托数量

3.3 tooltip

"包装尺寸 cm"	
"包装尺寸 inch"	
"单件净重 kg"	
"单件净重 lbs"
"打托高度 cm"	
"打托高度 inch"	
"整托毛重 kg"	
"整托毛重 lbs"







产品线：4条（气垫机、纸机、胶带机、气柱袋）
每个产品线下有3-4个主机型号
每个主机型号有7-10个配件型号
多级配件要支持到五级
每个主机型号有2-3个主机料号
每个配件型号有1-2个配件料号
每个主机/配件/耗材/备件都要有价格、库存、图片、规格等
关联关系：主要是主机与配件、配件与配件有关联关系，
展示逻辑如下：当用户选择产品后，展开一级配件，一级配件也可选择，按照产品图片，型号，料号，产品名称，电压，频率，托盘尺寸，一托数量，和产品展示一样的展示逻辑，展示阶梯价格，销售可以看到库存，展示描述和产品照片，有更多信息浮层显示，包装尺寸，包装毛重，打托后总高度，浮层显示有产品规格可以通过PDF文件下载，用户可以添加到购物车，确保价格显示正确的货币符号和单位制（公制/英制）。当用户选择一级配件后，自动展开二级配件，二级配件展示同一级配件，需要根据配件的具体情况来展示，最多展示五级
配件与备件、主机与耗材、耗材与主机等关联是通过表格的model字段进行关联的
我希望页面筛选项能全部有数据可选



BJT 产品管理系统 Demo 数据生成规则文档
1. 产品线（wp_bjt_product_lines）
共4条：气垫机、纸机、胶带机、气柱袋。
每条产品线有唯一 code、中文/英文名、描述、图片等。
2. 主机型号（wp_bjt_host_models）
每个产品线下有3-4个主机型号。
字段包括：型号编码、中文/英文名、描述、主图/副图、爆炸图PDF、类型、排序等。
每个主机型号有2-3个主机料号。
3. 配件型号（wp_bjt_accessory_models）
每个主机型号下有7-10个配件型号。
支持多级配件（最多五级嵌套），即配件下还可以有配件。
字段包括：型号、名称、描述、图片、类型、层级、排序等。
每个配件型号有1-2个配件料号。
4. 主机料号（wp_bjt_parts）
每个主机型号有2-3个主机料号。
字段包括：型号、料号、名称、品牌、规格、图片、包装尺寸、重量、状态等。
5. 配件料号（wp_bjt_accessories）
每个配件型号有1-2个配件料号。
字段包括：型号、料号、名称、品牌、规格、图片、包装尺寸、重量、状态等。
6. 耗材（wp_bjt_consumables）
每个产品线下有3-5个耗材，覆盖所有袋型、材料、厚度、宽度、长度等筛选项。
字段包括：型号、料号、规格、品牌、适用机型（app_model，逗号分隔）、袋型、材料、厚度、宽度、长度、图片、包装图片、状态等。
适用机型通过app_model字段与主机型号关联（多对多）。
7. 备件（wp_bjt_spare_parts）
每个主机/配件有2-3个备件。
字段包括：适配机型（app_model，逗号分隔，可为主机或配件型号）、料号、名称、规格、图片、包装尺寸、重量、状态等。
适用机型通过app_model字段与主机/配件型号关联（多对多）。
必选备件：部分备件的required_parts字段填写其他备件料号，required_quantity填写数量（逗号分隔），表示选购该备件时必须同时选购哪些备件及数量。
8. 关联关系（wp_bjt_relations）
只做主机-配件、配件-配件（多级嵌套）树状结构。
字段包括：父料号、子料号、子类型（accessory/spare_part）、层级、必选备件（required_parts/required_quantity）、排序等。
不涉及耗材和备件的适配。
必选备件：部分主机/配件的relations记录里，required_parts字段填入1-2个备件料号，required_quantity填数量。
9. 价格（wp_bjt_prices）
每个主机/配件/耗材/备件都有价格，支持多区域（CN/EU/US/AU等）、多币种（CNY/EUR/USD/AUD等）、阶梯价（min_quantity/max_quantity/discount_rate）。
字段包括：目标类型、目标ID、区域、币种、基础价格、数量区间、折扣率、状态等。
10. 库存（wp_bjt_inventory）
每个主机/配件/耗材/备件都有库存，支持多区域、多个仓库。
字段包括：目标类型、目标ID、区域、仓库、数量、预留数量、状态等。
11. 形状/袋型（wp_bjt_shapes）
仅有3种：pillow、bubble、tube。
字段包括：code、英文名、中文名、图片、排序等。
demo数据中所有袋型字段只引用这三种。
12. 材料（wp_bjt_materials）
仅有4种：HDPE、LDPE、Nylon、PAPER+PE。
字段包括：code、英文名、中文名、图片、排序等。
demo数据中所有材料字段只引用这四种。
13. 规格（wp_bjt_specifications）
每个产品线有多条规格，覆盖厚度、宽度、长度、重量等所有筛选项。
字段包括：规格类型、数值、单位、状态、排序等。
14. 耗材兼容性（wp_bjt_consumable_compatibility）
记录耗材与主机型号的适配关系。
字段包括：耗材料号、主机型号、状态等。
但实际适配关系主要通过耗材表的app_model字段实现。
15. 图片分配规则
所有图片字段都引用真实图片目录 /frontend/public/images/shop 下的文件，按业务语义合理分配。
袋型图片：pillow→MFB25.jpg，bubble→MEX.JPG，tube→MFC.jpg
材料图片：HDPE→HDPE.jpg，LDPE→LDPE.jpg，Nylon→MPR.jpg，PAPER+PE→MFA.jpg
产品/主机/配件/耗材/备件图片：用 LA-E4S.jpg、LA-E5P.jpg、MFB-A-26-80-33-L.jpg、MPE.jpg、MPR.jpg、MPV.jpg、PAPE-1.jpg、MFB25.jpg、MFC.jpg、MEX.JPG、MEY.jpg、MFA.jpg、EC2005.jpg、FR8003.jpg、LT9002.jpg、ET2002.jpg、ET1003.jpg 等，按业务语义分配。
包装图片、实物图片等：用 MFA.jpg、PAPE-1.jpg、MFB25.jpg 等。
16. 其他说明
demo数据要保证每个筛选项、每个展示项、tooltip、购物车等页面功能都能查到数据。
价格、库存、规格、图片、PDF等字段都要有数据，且能被页面筛选项覆盖。
货币符号和单位制（公制/英制）要覆盖。
所有多对多适配关系（如耗材/备件适配多个主机/配件）通过app_model字段（逗号分隔）实现。
业务关系图（简化版）
产品线 → 主机型号 → 配件型号（多级）→ 配件料号
主机型号 → 主机料号
主机/配件/耗材/备件 → 价格、库存、图片、规格
主机-配件、配件-配件（多级）通过relations表树状结构
主机/配件/耗材/备件的适配通过各自表的app_model字段
必选备件通过relations表和备件表的required_parts/required_quantity字段
袋型/材料字段只引用固定选项，图片字段用真实图片
如需补充或修正，请直接指出。
如已确认，请回复“确认”，我将严格按此文档生成全链路 demo SQL 脚本！
确认

非常感谢你的确认！
你所有的业务规则、字段要求、图片分配、适配关系、必选备件、多级配件
 


