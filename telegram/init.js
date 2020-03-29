'use strict'

require('dotenv').config()

let currentUser = require('./modules/User').currentUser
let msgActions = require('./modules/MsgActions').msgActions
let msgObserver = require('./modules/MsgObserver').msgObserver
let MakeRequest = require('./modules/Common').MakeRequest

/**
 * Обработчик кнопки Начало (/start)
 */
async function startHandler (msg) {
    let opt = {
        chat_id: msg.from.id,
        external: true,
        method: 'GET'
    }
    MakeRequest('sendMessage', {
        chat_id: msg.from.id,
        text: 'Getting user data...'
    })
    return await MakeRequest('users/email/' + (msg.from.username || msg.from.id) + '@t.me', opt)
        .then(async function (response) {
            let ret, action
            currentUser.set(response)
            if (!response.hasOwnProperty('id')) {
                MakeRequest('sendMessage', {
                    chat_id: msg.from.id,
                    text: 'Registering user...'
                })
                let opt = {
                    chat_id: msg.from.id,
                    external: true,
                    method: 'POST',
                    email: msg.from.username + '@t.me',
                    password: msg.from.id
                }
                ret = await MakeRequest('register', opt)
                    .then((response) => {
                        currentUser.set(response)
                        MakeRequest('sendMessage', {
                            chat_id: msg.from.id,
                            text: 'User ' + msg.from.username + ' registered...'
                        })
                        action = msgActions.get('welcome')
                        action.chat_id = msg.from.id
                        // makeRequest('sendMessage', action)
                        return action
                    })
            } else {
                action = msgActions.get('welcome')
                action.chat_id = msg.from.id
                // makeRequest('sendMessage', action)
                ret = action
            }
            return ret
        })
}

/**
 * Обработчик кнопки "List All Goals"
 */
async function listAllGoalsHandler (msg) {
    let opt = {
        chat_id: msg.from.id,
        external: true,
        method: 'GET'
    }
    // makeRequest('sendMessage', {
    //     chat_id: msg.from.id,
    //     text: 'Fetching goals data...'
    // })
    return await MakeRequest('goals', opt)
        .then((response) => {
            let markup = []
            response.forEach((goal) => {
                markup.push([
                    {
                        text: goal.title,
                        callback_data: 'goal_id_' + goal.id
                    },
                ])
                msgActions.set({
                    id: 'goal_id_' + goal.id,
                    key: '🛠 Goal ' + goal.id,
                    text: goal.text,
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [
                                {text: `🗂 Set contract`, callback_data: 'setGoalContract'},
                                {text: `💵 Set commit`, callback_data: 'setGoalCommit'}
                            ],[
                                {text: `⬅️ Back`, callback_data: 'listAllGoals'}
                            ]
                        ]
                    })
                })
            })
            markup.push([
                {text: `🧰 New goal`, callback_data:'createNewGoal'},
                {text: `⬅️ Back`, callback_data:'welcome'}
            ])
            return {
                chat_id: msg.from.id,
                text: 'Your goals:',
                reply_markup: JSON.stringify({
                    inline_keyboard: markup
                })
            }
        })
}

// назначаем интерфейнсные скрины / кнопки
msgActions.set({
    id: 'start',
    key: 'start',
    callback_data: startHandler
})
msgActions.set({
    id: 'welcome',
    key: 'welcome',
    text: 'Welcome to SharedGoals service.',
    reply_markup: JSON.stringify({
        keyboard: [
            [
                {text: `🧰 Goals`, callback_data: 'goals'},
                {text: `🛠 Settings`}
            ]
        ],
        resize_keyboard: true
    })
})
msgActions.set({
    id: 'goals',
    key: '🧰 Goals',
    text: 'What do you mean?',
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                {text: `🗂 List all`, callback_data: 'listAllGoals'},
                {text: `🧰 New goal`, callback_data:'createNewGoal'},
            ], [
                {text: `⬅️ Back`, callback_data:'welcome'}
            ]
        ]
    })
})

// Settings from subs to parent
msgActions.set({
    id: 'changeLanguage',
    key: `🇷🇺 Change language`,
    text: `🇷🇺 Change language`,
    callback_data:'chLang'
})
msgActions.set({
    id: 'chLang',
    key: `🇷🇺 Select language`,
    text: `🇷🇺 Select language`,
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                {text: `🇬🇧 English`, callback_data:'en'},
                {text: `🇷🇺 Русский`, callback_data:'ru'}
            ], [
                {text: `⬅️ Back`, callback_data:'welcome'}
            ]
        ]
    })
})
msgActions.set({
    id: 'settings',
    key: '🛠 Settings',
    text: 'Select Settings below',
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                msgActions.get('changeLanguage')
            ], [
                {text: `⬅️ Back`, callback_data:'welcome'}
            ]
        ]
    })
})
msgActions.set({
    id: 'listAllGoals',
    key: 'listAllGoals',
    callback_data: listAllGoalsHandler
})

// Not hooks
msgActions.set({
    id: '',
    key: '',
    hook: false,
    type: 'text/html',
    text: '<!doctype html>\n<html><head><meta charset="utf-8"></head><body><script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>Hello at ewg.ru.com.</body></html>'
})
msgActions.set({
    id: 'favicon.ico',
    key: 'favicon.ico',
    type: 'image/x-icon',
    hook: false,
    skip_logging: true,
    text: "data:image/x-icon;base64,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5tbe5tHb4s/a4NDZ3tHZ4NLZ4dHZ39Xa3Nfc3p2gojQuMTUvM1BNTz86PC8qLklFR0M/QjEuMjEvNDg4PTMzOTg4PzMzOSEiJygoLy4tNigmMB0dIxMUHj9HXUxTa01SZk1PXjs3Pn9yaLmehsOig8ymg8+ngc+mfs+mfNKofdOrf8TV4cTW4MTV4MHS3sLT3sfU4cbT4sLS4MHQ38DR3sTU3sjX387a4dDb483Z4mtqbSkjJj06Pl9bXkVCRD86PEA7Pjs4PjQ0OigoLUBAR0JCSDU1PC0sNSwrNCwrNDIwOygnMRocJj1EW09WbUpPYklMW0VFS5iZl7iwqsKzqMm3psizn8Stl7+njrughLmdf7fQ4bjO4LnO4bXL3bfL3LzM3cDQ4r7Q4rbM37DI27HI2bTL2bfM3LnN3rXK2VpdXyohIygkKUtLTWBfYGFcXlRPUkVESS0tMx4eJCcnLTc3Pjk4QTg3QDU0PS0sNTIxOjEvOSMkLkZMZE9VbEdMXkVHVVldZbnCx8fLz8zMzs/MzNDKyMzFw8a+vcC5tLixqrPM4bLL4LLM4LDJ3LLK3LjM3cDR4sDS5LfO4rDK3qzG2avF2KvF2K3G25OpuTM0NyYgIC8sLzMzM2hmaG1rbGJiZEtMUjs7QjIxOScnLSkpLzo5Q0FASjw7RDMzOzIxOjMxOyoqNE5UbVJYcUVJXEBBTnyEkMzX4s7X3dHY3tTY3dPW3c/U2tDS2M3R0snNzq/E2K7F26/J3bDK3rDK3LjM3b7Q37/S4LzQ4rXN4a7J3KvF2arE2KrE2Wx5iCAeJR4bHi8tLi8tL1lWWnBvcV9hY0ZGTUdHTERFTEBBRjQ0OTMzOkJBSkZGTj09QzQzOzEwOy0uOlRYdFheeURFWERFUqOwwcjY5MXT3sfT3MnU3MnT38nU4MzY4c7X4M7W3qi0xae4ya7E1LTL3rbM37jM3rvN3b/Q37/R4LrO4LXK3q7G26vD2KO90U1YZyAhLSMhJzExMzo5PDg4PFZWW0VGS0E/RklLU09dc0xZaTo7QS0uMzg4QEZFTUVFSzg3Py8uNi4uOVJXb1dcdUVGV1pgbrXJ27vP37fL3LfL2LvM2LrM3LvM37zO4L7P4MHQ3Kmpsq22vrjI07/R4cDR5L3P4bvN3L/O3L/P3b3O3brL3bbJ2rLH2Zmwwzc+SjEzPTo6QkA/QkpJSy0sMD0+RTI0PDMzOSgqMikxQjtJXzEyPS4uNDc2PkFBSUBASDQzOysqMiQlLElNYFZbcEZJV4SVp7nS5bbP4bLL3rHJ27bJ2rfK27XK3bHJ3bLI27LF1763u8fJytHa39Pf7NDf7Mna58PU4MDQ273O3L/Q3sLR48XT5cPU5LnM3WZvfUZHTFlZYVNSWFdVWTU0OT0+R0VHUEZGTjg5QUJCTD5ATj1ASzw+Rjc4QTs8RTk6QysrNCQjKxsaIDM2Q1BUZltnd7DJ4LzW7bzU6rbQ5LLN4bfM3rvL3bfL3rHH2KvC0K29ytXN0t/d3ebo6uXs89/s89jo8NDi68nb5MfZ5sfb6c3f7dLi79Lk79Xl9KaxwEFARldaYVRWXFBPUzk5Pj9BSldZYVdXXklKUkxNVExMVkpLVkxOWEVHUDk6RDM0PiUlMB4eJxwaHyIhJ0RIVZ6xxMrh9srg9Mrd8sTY7L7S5MDP3MbO18PL07vDyrG4u7CwsNrT1uTh5Ors7erv9Ofw9uLu9Nzr8dTm7tDi7c/j8NTm8dXn8tXn8tbn9MDP3k9SWUdJUEVJTUNHSzs/RDxARkpNVk1NVk5OWE5QWk9QWlBSXFFUX1ZaY01PWT4/TCgpMyEgKRoZHxwdJIiQntbl9dfk9dXi8tLe787Z58vT28zNztPMyNPIvdG/ssi0o8Ssl9LJ09vX4eDl6uLr8OLs8uDr893o8Nfl79Lj7tHi8NLj8NLi8tDi88/i8sve8HuHkkBARTg6Pz1DST1DSzg8Qzw7Qz4+Rk1MVVFUXlNXYFVWYVdZZGJkbmBiblJTYTk4QScnLRQVGTAzOsrS29/n793h6Nze4tjY3tTQ1NXLxNrFr+LDpeTAm+K6kt20i9qziM7J29HT5NXf7dfm8djn89jm89fk8dTi79Pi7dPi79Hg8M7f8cre8Mvg8c7g84+aqz09Rzg6QDg8QjpBSTQ6QTMyNzAwNkFASFZYYlldaVVWYl1famZoc2xte2BhbVJTW0NETDM0OhocIJmXmOLa1t7Sx9rKvNbFudfCsdy8neK4i+i5iO67ie67i+u6i+m9jtDW6tHb8NPh9dPk99Tk99Xk9NXj8dfk8tnm8djl8tTh8dHf8M/d7tTf7bK8yVNaa05UaElKVEZKUUJJUz5GUTo/RS4wNTg2P0xJVFdWYllZZFtdZ2hqdXByfGdqc0xQVktQYWt1jB0hKXFlW+LFqOK9mdy1i9mzi9qziuCyguW0f+q3gu26hO67he27h+q9jdjk8tjl9Nvm9t3m9t/k8+Dk7+Pk7eTk8OTo8OLo8N7j693c5d3X29nQ0Xt+iFNdeWx8pF5nflFXX1hha01YZUxUXj1DSTIyOTg2P0VCTU9NWFxeamtteWxwe1ZebUJMYXODqIOWwDA4SWJZU923juKxfeCtd92qdd6rduGtd+Wyeum2fuu3f+y4gu25g+25g+Lo7OPm6Ofk5evh3+7f2O7e1fLe0/Lh2u7i3uzh3erb0+jSxO7PtMqwnE5SW0hUb2B2oF5yk0xWY1lfZFJYYUpTW09YYDo+RiwtNi8vODw+RmJmbVRXYEBGU0BHXk5XeGlymGl5o0hTbUxGScedc+ezfOm0f+Wxfuayfem1f+u5guy7hO+9h/C8iO+8iO67hfHj2PPg0fXdyPfZvffVtfnVs/rVsvjXtvjZvPfYvPfVtfbQrPrRpryiiysuPTtHZ0VUd01ef0NOYEVJTk9UW1ljaGFteFtkb0ZNWDM4QCYnLkVGTC0vNywxPkpUbomYvqCs0HqJsD5HYkZBSMmievC/jPLCkfHAkPDAkPLDkPPFkvPGk/TGlPXFlfTElPTDk/nXt/nVtPnUr/jSqvnSqfnTqvnVq/rVrPrUrfrVrvrVrPnTrPnSq5qIhEhTdz5LczQ8XjlBXzc9TTEyNWhbVYl8cX58end0dG9ucFlaXUVDQzw6OzAxOz9GWWx6l2t7o3KDr1VjhhofMEhDROO+l/nNofjMoPnMn/fMoPnNofnOofnOofnOoPjMn/jLn/jMn/nPovnPovjPo/jQpfnRpvnSqfnTqfnTqPrTqvrUq/rUq/vUq+bDn2RicFhtmnCFsXCAqTpCXSovOV1UTtm3lN64kcSkgcyph82qib+hg62Qco95ZEVFUFZjfW6BoT5LdUJRgCszUh0fLnxwa/HLpPnQqPnRp/jRpPjQpPnRqPnSp/jRpfnQo/jPovjPovfQo/jJm/bImvbKmffLnPnNoPjPo/jQovjQovjQo/jQpfnQpfvSpr2ghj9IZGB7qnmVv0xdgyQrPSwwNKqRePvSo/nQovfOoPfOoPjPovfOovjOoNy3kVVQWUFScl95oz5Mdio0VR4jOywsNsOpkfrPpvnPpvnRqPjRpfjQo/jRpvjRp/jQpvnQpPjQo/jQo/jQpPTBkfO/kPLAj/PCkfXFlfXImffKmvbJmfXJmPfKm/jKnPfLnoRyZz1NdmN/r1dulis2VBIVJVJIQuK8kfjLmffJmfjIm/fImvfKmffJmfjJmezBlV9UVDhLcFFunUBTfSEqRxgdMjk3O9y5lfnLnffKnvjMoPjOofnPovjPofjNoPjOoPnPovjPovfPoPjPn+65he65hu25hO65he+8h/C/jPLAjfHAjPDAi/HBjPPBj+K3i1ZQVUNZhUFWfyo2VhkfNSkpMbKWdvLEkfHBkPHAkPHAkPDBj/DCj/PCj/LBje2/jW9eVTdLb0xqmUNdiig1VBEWJlRKR+m+lPPFk/LFlfTFlvXGl/fJmffJmvXHmfXImPbImfbImPfImPbHl+i0fui0fui1fOi0fem1fuu3gey5gu25guy5guq4ge66g8ifdz8/TTxNczRGaB4oPyEhK5B2YOy7iO+8he27hO+7he+7he+8hu+8hu+8hu66g+26hINrWztNckxmkzxUeiY0TxMWI4NtXvK/j/G+i/C/ivG+ifK9ivG+ifHAi/LAjfG/jO++ie++ifK/i/W/iuWxe+aye+Wye+aye+ayfOezfei1feq2f+q2f+m2f+u4f7mTcDo6TDZFaC07Vh0hK4JrW+a0g+65g+y4geu4fuu3f+y5gO66ge24geu3gOq2f+y4gZt6YzlFZUpmkDpPcSApQSclLLyXd/G8hu26g+25guy5gey4gOq3f+u3gOy4gey5geq3fum2f+u3gO25geOzguSzguW0guSzgOWzgOW0gOW1gei2gum3g+m3g+q5hLqWdDk4RicxSxshMWNXTdywg+y5guu4guu5geq4gOq3f+q3gOq3gOu3f+m2fui2feq3f76WckRGXD9TezBBYCQtQ1pMROKxg+y3gOq2f+m1fui2fee1fOe0fOezfeezfOazfOe0fOaye+ayfOe0fd28pd27o928ody7oNy6nd26m967m+G8nuO/o+PBpObCpsWnkzg0PBodK0xFRcami+i+leS8k+W7k+a7kOa5jOe5i+m6i+m6iui5iOi4hua4hem4hdyvgltPUy03VSs5VycrOKOEa+q5iOe1hOe1gea1f+a0fuazfue0fue0fuazfeWyfOa1f+azfuSyfOazfMy+u8q+usu+vMzAvs/Cv9HBvNDAvNPBvdbGw9nLxtvMx8/AvVtVXUlITriopdzFutvCtdrCtdrAtNq+r9i7pdm7oty+o97ApN+/o+C/o+C/o9+9oN+8n4d2cDA0RyMpPFVQT9OzleK+muO9muO8meK8l+S8l+S8luS8luS8leW7k+S6kuK8l+K9mOO5juS2iLqxs7WxtLm1u7+/xsXDycnFysnFzMXDzcjG0c3K09HN1NLN1Le2vra1u8vGy8jDx8fDx8jDysfEy8fAxsa8vsa7usq9uc/BudTFvNXGv9fHwtfIwNTDurqrqFZUW0JCSaidlc68q8++r9PAstbAtNjBtdnDuNrFudnFt9vFt9/Ftt3GtNvGt9jFutrEt9zDsaieoKOcnqiipbCssrq3wcK/ycXCzcK/zcTCz8bFz8vKzszJzczIy8fEycC9xLm4wri2xLm5x73Azr+/zr68x7u5wru5vsC7vsjCxM3IzM/Mz83LzsfDxcK7vqqjpqKeoLmxsLmzsby2t8C5vMG9v8S/wsfCxMjDxsfDxcnFx9HJytTPz9bR09LO0c7Ky9TOy5mUlZSPjpiTkp6YmqegqrGut7i2wLu3wru2w7u4wb69wcC9vsS8vb+4ubiytrGtt7GsurSxvbm4xL++yr+9xby6wLm3vbu3vb+6wMPByMfGzMfFzMC+xbq1vbu0ubayt7Wus7KusrOyt7S0u7W2vre3vri4vra3vba2vry8w8TEys7N1NLS2dLT2dHQ1dLR1Z6cnpaTk5aQj5eRkZ+XmqeipbCusbixtrWvtq+rsquqraqpqa2nqLKprLSpsK2psK2ptLGtuLWzurm4vry4vrq1vLi0u7m1vLm1vb26wsG/xsC+xbu5wbe0vLezu7azvLWxurSxuLWyvbe2wLe3wLW1vbSyubGvtrCutra1vLq6wMTEysvL0cvK0MrH0MTBzQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAgAAAAQAAAAAEAGAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAD51K340aj3zqP3zaH3zKD3zaH4z6T2zKD0yZv1y5/3zaL2yp30yJz0yJv2ypumim0qLTwqLUIrLUMwNEo9QVVWXG5pboFhZnlSU2RPT2FDRFY2NUUpKDMrJy6ihmrtv474z6f2y6L0x5v2y573zqH3zqX50qv40qr50qv61rH51rH50qj40qn51Kz81q2gh24aGSQtMEkuMUoxNE05PVNLUGNgZnlma3xYWWlMTFxDQVE2NUEuLTZ3ZFXmvJDxxZf20rL10LD1zqn40Kr50av60q371bH61rH617P62rb62bT61rD52LP62rj82bWKdWENCxAlKD0zOFU0OVQ4PVNITWBcYXRpbHxeXmxQT19EQ1A3NT5lWFHft4/0x5nyxZf007b21LX607P607H607D61LH61rT52LX52Ln52bv62rz627363sD638H838F6alwKCAwZGikyOVgzO1k3PFRCR1lTWGtqbXxjZG9SUF9DQU5BPkO9oIT50af2zaT0y6Hy0LL0z6330bD51LT51rf417n42Lr62bv62bz62r363L763b/74MH738L738FwY1YJCA0PDxouNFIxOFgyOFU5PVJGSlxgZHRmZ3JWVWBKSlRiWlfnxKH606z40ar5063vzrXvza/z0bP31rf417j42Lr42bv52Lv617j72rj83bn93br94Lv+4L/83r5kWEwJBwwLCxUuNFE0Ol0yOFc6PldJTmJbYHFnaXJXV1xLTFKQgHL40qz40qv30Kj406vvzrbtzK/xz7Hz0rH007H01Lb21rj417r41rXYu5+rlYGZhnSWhnSZiHmLe283MTAODRAHBQ4hJDs4QGE0Olk5PFZARVtVWmxiZHBVVVtKR0u6pI792rb617P61K761K3mxq3mxqnpyq3sy63sza3tz7Hw0bXz07XpyapZT0cODxUTExgpKC4rKC8aGB4bGh8pKCoPDhQREB4zO1g8RGQ7QV09QVZGS11SV2RNTlVMR0jYvaP927j52LP61K3506vPt6fWuqHfwaXiwqbhw6bhxKvixK7oyauqknwcGh0TFBkbGh8wLzM9O0AtKzAoKCw1NToiISYFBAsWGSg6RGFASWZARVtARVdGSVlFRlBbU0/rx6X71K3606z50qv506u/tLHEtKjJtqPJs6DHsZ7GsJ/GsKDQtJyUfGkzMDM5OD0vLDEwLS8/PUAuLDAmJis1NTs0NDkREBYFAwoRER4zN08/RFo+Q1c/QlI5OkVwY1juxZz0y6D2z6X40Kj40ana2NjV0tHLyMa/vrm0raqwqKKvp6GvopeejHpHPj09OT1CPkA5NDY5NjgtKzAtLTI4OD07OkAqKTAODhQIBwwQEBg0OE09QVVAQ1Q2NUGDb17rvY/sv5Huw5XxxZj0yZzp6+vl5+ff4ePY293Kz9LGyszGycy/wcK9vLlzcG4/Oj1TTlA4MzVAOz0yLTMtLDE3Nzw4OD4zMzksLTMeHSUREBUmKjpCSV9FSVs6OEGNdmHZrYDcr4LfsoLktobrvY3V4ObT3uPR3OPS3OTN2eHL1t/N1+DP2d/V3N+0ub1EP0JEP0JDP0E/Oz09OT0yMDU0NDo7O0IvLzUoKC8tLDUiISkiJTNKUWlMUWRFQ0yShXrBpo7Mq4vMqIXLpX/Mpn660eG70OC4zd29zt7B0eK6zuC1y9y5ztu+0d66zNlTU1UtJytTUVNXU1VMSEs1NTomJSs3Nj03Nz8zMjsvLjcvLjcsLjxNU2tHS11UV2CxtrnIxsXOxsHLwLnCt626rqCxyt+xy9+xyt22y92/0eG60OOwyd6rxdisxtqQpLUvLjEpJSdCQUNua21bW19AQUc0MzotLTM6OkNAP0g1NT0xMDk3OEhUWXRCRVZyeYbJ1d/O1t3Q193P1dzO1NnL0NOpucutwtSzy963y969z96+0eC3zeCvx9urxNlreoshISksKy44NzlVVVlJSk9FRk1KU2I8QEcyMjlDQ0s/P0YwLzg5OkpXXHZGSFmVorO/0uG7zdq+ztq/zt/B0eHE0t+wsbi8yNHE1eXB0+O+z92+zty9zt67zN60ydthbXw6O0RFREpDQkU3OD45OkIxMzs2PU43O0kzMzo9PUU7O0MqKTErLTdPU2dfaHmvx9u30OOxy922ytu2yt2wyNuwxNXTzc/f4ePf6fHW5e/L3efF1uLG2OfN3ezQ4e+irr1OT1ZWV15KSU08PUVTVFxJSVFJSlNHSVRGSFE8PUcxMTwhISodGyJBRVKcrsHH3vTE2e+80uW/ztzBy9e2wsqvtrrb1Nrm5+rn7/Pj7vTa6fDR4+3R4/DU5fHV5vPE0+NaXmZDRUpAREk7P0ZHSFFNTVZPUVtRU11VWGJUVmE9PUokJCwXFx15f4rX5PLX4vDT2+nO09nSy8XYx7fTu6bKsJXQzNzX3era6PHa5/PX5fDT4u7S4e/Q4PHM4PHL3vBze4g4OT86P0Y3PUQ0NDpAP0dVV2JWWGReYGpoaXZYWWQ+P0YkJSt/gIPh3Nnb0cjWycDZwqziu5TqvI7quovluYvS2+7U4fTW5ffY5PTa5PHc5vLa5fHV3+7V3eqwt8NaYnlRVmhJTlZETVg7QEc1NTxKR1JWVWBfYWxvcXxbYGpUXXBVX3dXUEzevZzetYnasYXesYDmtH7suILtuoXsu4ng5+3j5ero4uPr4Nzu4Nzs4+Lp4t/m2NDmzrx8eHpRYIBgcpRSW2ZUW2RMVV4+Q0oxMTo/P0hcX2hRVWFHT2dpdZlldJpRTVPPpHjnsnzjsHvmsnzquIDtu4Tvu4fuu4X0383128P31rf41bH51rL417j317f4067qxaFaV2E4RWdFUnM/R1VNTlJlam1iaXJKT1gyNDo6O0EwNEJfa4mMmsFcaotEQkrTrIP1xZTzw5TzxZX1x5b1yJf2x5f1xpb50af50Kb40Kb50qj51Kn61Kr61Kv81qzGq5NZZYhgcZxBSmk0Nz+Zg2/ApIaymoGuloCVgGtmWlNKU2hhcpRLWoYsNE9ZUlHsx6H50ab40KP50KX50ab50KP4z6L4z6L2xpj1x5f2yZr4zaD4zqD3zqD4z6L5z6OMfHVWbZllfaYoMUlZUUrsxZn5zp/3zJ74zZ/4zZ62mH5DT2tRaZQtOFsdITWZhXX6z6X5z6X40KT40KT40KX50KT40KP40KPwu4jvu4fwvIjxwY7zw5Dywo/0xJHluY1dXGhHXoovPVwlJjKvkXL1xZPzwpLzw5LzxJL2xZLHoXxCTWZJZZQtPF4fIS65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"
})

// назначаем кастомные слушатели и запускаем
msgObserver
    .init()
    .start()
