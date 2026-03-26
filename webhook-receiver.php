<?php
// ===== WEBHOOK RECEIVER PARA 55PBX =====
// Este arquivo recebe os webhooks da 55PBX e processa os dados

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Permitir apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Log para debug
$logFile = 'webhook_log.txt';
$timestamp = date('Y-m-d H:i:s');

// Função para log
function writeLog($message) {
    global $logFile, $timestamp;
    $logMessage = "[$timestamp] $message\n";
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}

// Receber dados do webhook
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Log do webhook recebido
writeLog("Webhook recebido: " . $input);

// Validar se recebeu dados
if (!$data) {
    writeLog("Erro: Dados inválidos recebidos");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data']);
    exit;
}

// Processar diferentes tipos de eventos
$eventType = $data['event'] ?? 'unknown';
$callId = $data['call_id'] ?? uniqid('call_');
$from = $data['from'] ?? '';
$to = $data['to'] ?? '';
$status = $data['status'] ?? 'unknown';
$duration = $data['duration'] ?? 0;
$timestamp = $data['timestamp'] ?? date('c');

// Converter para formato do Velodesk
$phoneCall = [
    'id' => $callId,
    'number' => $from,
    'name' => $data['customer_name'] ?? 'Cliente',
    'type' => $data['direction'] ?? 'incoming',
    'status' => $status,
    'duration' => $duration,
    'timestamp' => $timestamp,
    'agent' => $data['agent'] ?? null,
    'ticketId' => null
];

// Salvar no arquivo de dados (simulando banco)
$dataFile = 'phone_data.json';
$phoneData = [];

if (file_exists($dataFile)) {
    $phoneData = json_decode(file_get_contents($dataFile), true) ?: [];
}

// Adicionar nova chamada
$phoneData['calls'][] = $phoneCall;

// Manter apenas as últimas 1000 chamadas
if (count($phoneData['calls']) > 1000) {
    $phoneData['calls'] = array_slice($phoneData['calls'], -1000);
}

// Salvar dados
file_put_contents($dataFile, json_encode($phoneData, JSON_PRETTY_PRINT));

writeLog("Chamada processada: $callId - $from - $status");

// Se for chamada perdida, criar ticket automaticamente
if ($status === 'missed' && ($data['auto_create_tickets'] ?? true)) {
    $ticketData = [
        'id' => 'TKT-' . time(),
        'subject' => "Chamada perdida de $from",
        'description' => "Cliente $from tentou ligar mas não foi atendido. Callback necessário.",
        'priority' => 'medium',
        'status' => 'open',
        'category' => $data['default_category'] ?? 'suporte',
        'created_at' => date('c'),
        'phone_call_id' => $callId,
        'phone_number' => $from
    ];
    
    // Salvar ticket
    $ticketsFile = 'tickets_data.json';
    $tickets = [];
    
    if (file_exists($ticketsFile)) {
        $tickets = json_decode(file_get_contents($ticketsFile), true) ?: [];
    }
    
    $tickets[] = $ticketData;
    file_put_contents($ticketsFile, json_encode($tickets, JSON_PRETTY_PRINT));
    
    writeLog("Ticket criado automaticamente: TKT-" . time());
}

// Resposta de sucesso
echo json_encode([
    'status' => 'success',
    'message' => 'Webhook processed successfully',
    'call_id' => $callId
]);

writeLog("Webhook processado com sucesso");
?>

