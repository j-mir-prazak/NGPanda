#!/bin/bash
if [ ! -z $1 ]
then
	tty=$1
	#sane = basic settigs; -echo = no loopback echo of recieved data
	stty sane -echo speed 9600 -F "$tty"
	#2>&1 1>/dev/null
fi
