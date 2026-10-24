from booking import can_book
def test_booking_logic():
    now = 540         # 09:00
    blocked = False
    existing = [(600, 660)] 

    # 1. Touching 
    assert can_book(660, 720, now, blocked, existing) == True, "Тест 1 провален: касание границами должно разрешаться"

    # 2. Overlap 
    assert can_book(630, 690, now, blocked, existing) == False, "Тест 2 провален: пересечение должно отклоняться"

    # 3. Blocked Room 
    assert can_book(660, 720, now, blocked=True, existing=existing) == False, "Тест 3 провален: для заблокированной комнаты всегда False"

    # 4. Exactly 
    assert can_book(720, 840, now, blocked, existing) == True, "Тест 4 провален: ровно 120 минут разрешено"

    # 5. 121 minutes 
    assert can_book(720, 841, now, blocked, existing) == False, "Тест 5 провален: более 120 минут должно отклоняться"

    # 6. Starts now 
    # Условие: start должно быть строго больше now (start > now)
    assert can_book(540, 570, now, blocked, existing) == False, "Тест 6 провален: старт в 'now' запрещен"

    # 7. Reversed times
    assert can_book(700, 650, now, blocked, existing) == False, "Тест 7 провален: start > end должно отклоняться"

    print("✅ Все тест-кейсы в test_booking.py успешно пройдены!")

if __name__ == "__main__":
    test_booking_logic()