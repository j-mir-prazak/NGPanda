#!/bin/bash
if [ ! -z $1 ]
then
	tty=$1
	#sane = basic settigs; -echo = no loopback echo of recieved data
	cat "$tty"
fi
