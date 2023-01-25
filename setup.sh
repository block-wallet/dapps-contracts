#!/bin/bash

printf "\n\n"
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' -
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' .

## setup node
printf "node version:\n"
source ~/.nvm/nvm.sh [ -x "$(command -v nvm)" ] && nvm ls
source ~/.nvm/nvm.sh [ -x "$(command -v nvm)" ] && nvm use
## check engine
npx check-engine

printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' .
# setup repositories
printf "data-sources:\n"
rm -rf ethereum-lists
rm -rf revoke-cash

printf "cloning into revoke-cash...:\n"
git clone git@github.com:RevokeCash/revoke.cash.git revoke-cash

printf "\ncloning into ethereum-lists...:\n"
git clone git@github.com:ethereum-lists/contracts.git ethereum-lists

printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' .
# install dependencies
printf "install dependencies:\n"
yarn