private
private-bin bash,node,sqlite3,ghc,gore,pypy3,scala,amm,ls
blacklist /boot
private-dev
read-only /etc
blacklist /media
blacklist /mnt
blacklist /opt
read-only /proc
blacklist /root
read-only /run
blacklist /sys
private-tmp
read-only /usr
blacklist /var
include /etc/firejail/default.profile