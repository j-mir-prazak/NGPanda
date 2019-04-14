#!/bin/bash
if [ ! -z $1 ]
then
	tty="$1"
	if [ ! -z $2 ]
	then
	command="$2"
	echo -n "$command" > "$tty"
	fi
fi
