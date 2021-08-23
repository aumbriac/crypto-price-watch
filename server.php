<?php

define('API_KEY', '');
$symbol = $_REQUEST['symbol'] ?? null;

if ($symbol === null)
  exit("API Error.");
$data = file_get_contents('https://min-api.cryptocompare.com/data/v2/histominute?fsym=' . $symbol . '&tsym=USD&limit=119&api_key=' . API_KEY);

exit($data);