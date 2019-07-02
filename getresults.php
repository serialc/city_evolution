<?php
//Filename: getresults.php
//Purpose: get results from city evolution

$fh = fopen('results.txt', 'a');

fwrite($fh, $_POST['beta']."\t".
	$_POST['gamma']."\t".
	$_POST['bg']."\t".
	$_POST['n']."\t".
	$_POST['theta']."\t".
	$_POST['phi']."\t".
	$_POST['gh']."\t".
	$_POST['gr']."\t".
	$_POST['atdg']."\t".
	$_POST['failg']."\t".
	$_POST['hh']."\t".
	$_POST['hr']."\t".
	$_POST['atdh']."\t".
	$_POST['failh']."\t".
	"\n");

fclose($fh);

?>
